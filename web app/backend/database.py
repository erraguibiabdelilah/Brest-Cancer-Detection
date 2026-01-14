import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'abdelilah'),
    'password': os.getenv('DB_PASSWORD', 'root'),
    'database': os.getenv('DB_NAME', 'agileDb'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

@contextmanager
def get_db_connection():
    """Context manager pour obtenir une connexion à la base de données"""
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        yield connection
    except Error as e:
        print(f"Erreur de connexion à MySQL: {e}")
        raise
    finally:
        if connection and connection.is_connected():
            connection.close()

def init_database():
    """Initialise la base de données et crée les tables si elles n'existent pas"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Créer la table users si elle n'existe pas
            create_table_query = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            
            cursor.execute(create_table_query)
            conn.commit()
            print("✅ Base de données initialisée avec succès")
            
    except Error as e:
        print(f"❌ Erreur lors de l'initialisation de la base de données: {e}")
        raise

