from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import mysql.connector
from mysql.connector import Error
from database import get_db_connection
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration pour le hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration JWT
SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 jours

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe en clair correspond au hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash un mot de passe"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crée un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Vérifie et décode un token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_user_by_email(email: str) -> Optional[dict]:
    """Récupère un utilisateur par son email"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT id, email, password_hash, name FROM users WHERE email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
            return user
    except Error as e:
        print(f"Erreur lors de la récupération de l'utilisateur: {e}")
        return None

def get_user_by_id(user_id: int) -> Optional[dict]:
    """Récupère un utilisateur par son ID"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT id, email, name FROM users WHERE id = %s"
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            return user
    except Error as e:
        print(f"Erreur lors de la récupération de l'utilisateur: {e}")
        return None

def create_user(email: str, password: str, name: str) -> Optional[dict]:
    """Crée un nouvel utilisateur"""
    try:
        # Vérifier si l'utilisateur existe déjà
        existing_user = get_user_by_email(email)
        if existing_user:
            return None  # L'utilisateur existe déjà
        
        # Hasher le mot de passe
        password_hash = get_password_hash(password)
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            query = "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)"
            cursor.execute(query, (email, password_hash, name))
            conn.commit()
            
            # Récupérer l'utilisateur créé
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "email": email,
                "name": name
            }
    except Error as e:
        print(f"Erreur lors de la création de l'utilisateur: {e}")
        return None

def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authentifie un utilisateur avec email et mot de passe"""
    user = get_user_by_email(email)
    if not user:
        return None
    
    if not verify_password(password, user['password_hash']):
        return None
    
    # Retourner l'utilisateur sans le password_hash
    return {
        "id": user['id'],
        "email": user['email'],
        "name": user['name']
    }

