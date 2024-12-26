import psycopg2
from psycopg2 import sql

def postgres_connect(database, user, password, host, port):
    try:
        connection = psycopg2.connect(
            database=database,
            user=user,
            password=password,
            host=host,
            port=port
        )
        print("Bağlantı başarılı.")
        return connection
    except Exception as e:
        print(f"Hata: {e}")
        return None

def find_user_by_username(connection, username):
    cursor = connection.cursor()
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    cursor.close()
    return user if user else None
   

def create_user(connection, username, password):
    cursor = connection.cursor()
    query = "INSERT INTO users (username, password) VALUES (%s, %s)"
    cursor.execute(query, (username, password))
    connection.commit()
    cursor.close()
    print("Kullanıcı oluşturuldu.")
 

def fetch_conversation_history(connection, user1_id, user2_id):
    cursor = connection.cursor()
    query = sql.SQL("""
    SELECT m.id, u.username as sender, u2.username as receiver, m.message, m.sent_at
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    JOIN users u2 ON u2.id = m.receiver_id
    WHERE (sender_id = %s AND receiver_id = %s) 
       OR (receiver_id = %s AND sender_id = %s)
    ORDER BY sent_at ASC
    """)
    cursor.execute(query, (user1_id, user2_id, user1_id, user2_id))
    history = cursor.fetchall()
    cursor.close()
    return history if history else None

def get_userid_by_username(connection, username):
    cursor = connection.cursor()
    query = "SELECT id FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    userid = cursor.fetchone()
    cursor.close()
    return userid[0] if userid else None

def fetch_users(connection):
    cursor = connection.cursor()
    query = sql.SQL("SELECT username FROM users")
    cursor.execute(query)
    users = cursor.fetchall()
    cursor.close()
    if users:
        return users
    else:
        return None