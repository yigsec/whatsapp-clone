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
        print("Connection successful to PostgreSQL")
        return connection
    except Exception as e:
        print(f"Error: {e}")
        return None

def find_userid_by_username(connection, username):
    try:
        cursor = connection.cursor()
        query = "SELECT id FROM users WHERE username = %s"
        cursor.execute(query, (username,))
        result = cursor.fetchone()
        cursor.close()

        if result is not None:
            return result[0]
        else:
            return None  # Return None if no user is found

    except Exception as e:
        print(f"Error finding user ID: {e}")
        return None

def insert_message(connection, sender_id, receiver_id, message, sent_at=None):
    try:
        cursor = connection.cursor()
        if sent_at is None:
            query = """
                INSERT INTO messages (sender_id, receiver_id, message)
                 VALUES (%s, %s, %s)
            """
            params = (sender_id, receiver_id, message)
        else:
            query = """
                INSERT INTO messages (sender_id, receiver_id, message, sent_at)
                 VALUES (%s, %s, %s, %s)
            """
            params = (sender_id, receiver_id, message, sent_at)
        
        cursor.execute(query, params)
        connection.commit()
    except Error as e:
        connection.rollback()  # Rollback the transaction on failure
        print(f"Error inserting message: {e}")
    finally:
        cursor.close()