from werkzeug.security import generate_password_hash, check_password_hash
from fastapi.middleware.cors import CORSMiddleware

from db import *
from models import *
from utils import *
from authoritation import *
import json
import logging
import asyncio
from typing import Dict
from config import settings
from datetime import datetime
from kafka import KafkaProducer
from fastapi.websockets import WebSocketDisconnect
from fastapi import FastAPI, HTTPException, Depends, WebSocket


logger = logging.getLogger('tcpserver')
app = FastAPI()

origins = ["*"]  # Tüm originlere izin ver

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_connection = postgres_connect(settings.POSTGRES_DB, settings.POSTGRES_USER, settings.POSTGRES_PASSWORD, settings.POSTGRES_HOST, settings.POSTGRES_PORT)

producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str ,WebSocket] = {}
        print(self.connections)

    def user_is_in(self, user_name):
        return user_name in self.connections
    
    def get_active_users(self):
        return list(self.connections.keys()) 
    
    async def connect(self, websocket: WebSocket, user_name:str):
        await websocket.accept()
        self.connections[user_name] = websocket 
        print(self.connections)
    
    async def disconnect(self, user_name: str):
        del self.connections[user_name]

    async def broadcast(self, data: str):
        for connection in self.connections.values():
            await connection.send_text(data)

    async def send_message_to_client(self, sender:str ,receiver:str, message:str, sent_at:str):
        if receiver in self.connections:
            data = json.dumps({
                "type": "message",
                "content": {
                    "sender":sender,
                    "message":message,
                    "sent_at":sent_at
                    }
            })
            await self.connections[receiver].send_text(data)
    
    async def send_user_event_to_client(self, username:str , receiver:str, time:str, event:str):
        if receiver in self.connections:
            data = json.dumps({
                "type": "user_event",
                "content": {
                    "user":username,
                    "event": event,
                    "time":time
                    }
            })
            await self.connections[receiver].send_text(data)
       
manager = ConnectionManager()


@app.post("/signup")
def signup(user: SignupRequet):
    now = str(datetime.now())
    if user.username == None or user.username.replace(" ", "") == "":
        raise HTTPException(status_code=400, detail="Missing 'username' field in JSON.")
    if user.password == None or user.password.replace(" ", "") == "":
        raise HTTPException(status_code=400, detail="Missing 'password' field in JSON.")
    
    try:
        existing_user = find_user_by_username(db_connection, user.username)
    except Exception as e:
        raise HTTPException(status_code=500,detail=e)

    if existing_user:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor.")

    hashed_password = generate_password_hash(user.password, method='pbkdf2:sha256')

    try:
        create_user(db_connection, user.username, hashed_password)
    except Exception as e:
        raise HTTPException(status_code=500,detail=e)
    
    kafka_user_event_data = {
        "username": user.username,
        "event": "signup",
        "time": now
    }
    producer.send('user_event', value=kafka_user_event_data)

    try: 
        for receiver in manager.connections:
            if receiver!=user.username:
                asyncio.run(manager.send_user_event_to_client(user.username, receiver, now, "signup"))             
    except Exception as e:
        print("singnup suer event can't send", e)


    return {"message": "Kullanıcı başarıyla kaydedildi."}


@app.post("/login")
def signup(request: LoginRequet):
    if request.username.replace(" ", "") == "" or request.username == None:
        raise HTTPException(status_code=400,detail="Missing 'username' field in JSON.")
    if request.password.replace(" ", "") == "" or request.password == None:
        raise HTTPException(status_code=400,detail="Missing 'password' field in JSON.")

    try:
        user = find_user_by_username(db_connection, request.username)
    except Exception as e:
        raise HTTPException(status_code=500,detail=e)
    print(user)
    if user and check_password_hash(user[2], request.password):
        
        access_token = create_access_token(
            data={"sub": request.username}
        )
        print(access_token)
        active_sessions.add(access_token)
        return {"user_name": user[1], "access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401,detail="Invalid username or password")
    
@app.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    if token in active_sessions:
        active_sessions.remove(token)
        return {"message": "Logout successful"}
    else:
        raise HTTPException(status_code=401,detail="Not logged in")

   
@app.websocket("/chat/{user_name}")
async def websocket_endpoint(websocket: WebSocket, user_name: str):
    logger.warning(136)
    await manager.connect(websocket, user_name)
    now = str(datetime.now())

    # inform kafka that user has logged in
    kafka_user_event_data = {
        "username": user_name,
        "event": "login",
        "time": now
    }
    producer.send('user_event', value=kafka_user_event_data)

    # inform users that user has logged in
    for receiver in manager.connections:
        if receiver!=user_name:
            await manager.send_user_event_to_client(user_name, receiver, now, "login")
    
    try:
        while True:
            payload = await websocket.receive_json()
            sent_at = datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")
            if "receiver" not in payload:
                await websocket.send_text("Missing 'receiver' field in JSON.")
                continue
            if "message" not in payload:
                await websocket.send_text("Missing 'message' field in JSON.")
                continue
            if "sent_at" not in payload:
                sent_at = payload["sent_at"]

            message = payload["message"]
            receiver = payload["receiver"]

            kafka_data = {
                "sender": user_name,
                "receiver": receiver, 
                "message": message,
                "sent_at": sent_at,
            }
            
            producer.send('sent_messages', value=kafka_data)
            await manager.send_message_to_client(user_name, receiver, message, sent_at)
    
    except WebSocketDisconnect:
        
        # inform kafka that user has logged out
        kafka_user_event_data = {
            "username": user_name,
            "event": "logout",
            "time": now
        }
        producer.send('user_event', value=kafka_user_event_data)

        # inform users that user has logged out
        for receiver in manager.connections:
            if receiver!=user_name:
                await manager.send_user_event_to_client(user_name, receiver, now, "logout")
        
        # disconnect user
        await manager.disconnect(user_name)


@app.get("/chat/{username}/history")
def chat_history(username: str, current_user: str = Depends(get_current_user)):
    user1_id = get_userid_by_username(db_connection, username)
    user2_id = get_userid_by_username(db_connection, current_user)
    history = fetch_conversation_history(db_connection, user1_id, user2_id)
    logger.warning(history)
    if history==None:
        return {'history':history}
    chatHistory = []
    for message in history:
        m = {}
        m['id'] = message[0]
        m['sender'] = message[1]
        m['receiver'] = message[2]
        m['message_text'] = message[3]
        m['sent_at'] = message[4]
        chatHistory.append(m)
    return {'history':chatHistory}
# rec, sen, time

# yeni endpoint: butun user return
@app.get("/users")
def get_users( current_user: str = Depends(get_current_user)):
    users =  fetch_users(db_connection)
    active_users = manager.get_active_users()
    active_users = [item for item in active_users if item != current_user]

    if users== None:
        return None
    logger.warning(users)
    user_list = []
    for u in users:
        if current_user != u[0]:
            user_list.append(u[0])

    sorted_list = sort_and_merge_lists(user_list, active_users)
    return {'users' : sorted_list}


@app.get("/active_user")
def get_users( current_user: str = Depends(get_current_user)):
    active_users = manager.get_active_users()
    return {'active_users' : active_users}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.API_HOST, port=8000, reload=True)

