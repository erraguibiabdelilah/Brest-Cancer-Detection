from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import timedelta
from script import predict_from_bytes
from flashcard_service import generate_flashcards, FlashCard, FlashCardConfig
from database import init_database
from auth import (
    create_user, authenticate_user, create_access_token, 
    verify_token, get_user_by_id, ACCESS_TOKEN_EXPIRE_MINUTES
)
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Breast Cancer API",
    description="API de prédiction IDC avec ResNet50",
    version="1.0.0"
)


# Configuration CORS - Autoriser toutes les origines en développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En développement, autoriser toutes les origines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Middleware pour logger les requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"📥 {request.method} {request.url}")
    logger.info(f"   Headers: {dict(request.headers)}")
    response = await call_next(request)
    logger.info(f"📤 {request.method} {request.url} - Status: {response.status_code}")
    return response

# Initialiser la base de données au démarrage
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Démarrage du serveur FastAPI...")
    try:
        init_database()
        logger.info("✅ Base de données initialisée")
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation de la base de données: {e}")
    logger.info("🌐 Serveur prêt sur http://localhost:8000")

# Sécurité pour les tokens JWT
security = HTTPBearer()

# ========== FONCTION D'AUTHENTIFICATION ==========

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dépendance pour obtenir l'utilisateur actuel à partir du token JWT
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = int(payload.get("sub"))
    user = get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# ========== ENDPOINTS ==========

@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint pour prédire le cancer du sein à partir d'une image
    Nécessite une authentification JWT
    """
    image_bytes = await file.read()
    result = predict_from_bytes(image_bytes)
    return result
    

@app.get("/")
def home():
    return {"message": "IDC Breast Cancer Prediction API is running "}

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Gestionnaire pour les requêtes OPTIONS (preflight CORS)"""
    return JSONResponse(
        status_code=200,
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# ========== MODÈLES POUR L'AUTHENTIFICATION ==========

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Le mot de passe doit contenir au moins 6 caractères")
    name: str = Field(..., min_length=1)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

# ========== ENDPOINTS D'AUTHENTIFICATION ==========

@app.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Endpoint pour créer un nouveau compte utilisateur
    """
    # Vérifier si l'utilisateur existe déjà
    user = create_user(request.email, request.password, request.name)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    # Créer un token d'accès
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"]), "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    )

@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Endpoint pour se connecter avec email et mot de passe
    """
    user = authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Créer un token d'accès
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"]), "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    )

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Endpoint pour obtenir les informations de l'utilisateur actuellement connecté
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name")
    )

# Modèle pour les requêtes de génération de flashcards
class FlashCardRequest(BaseModel):
    text: str = Field(..., description="Le texte source pour générer les flashcards")
    max_question_words: Optional[int] = Field(default=20, description="Nombre maximum de mots par question")
    max_answer_words: Optional[int] = Field(default=40, description="Nombre maximum de mots par réponse")
    number_of_cards: Optional[int] = Field(default=15, description="Nombre de flashcards à générer")
    temperature: Optional[float] = Field(default=0.9, description="Température pour la génération (0.0-1.0)")

class FlashCardResponse(BaseModel):
    flashcards: List[dict] = Field(..., description="Liste des flashcards générées")
    total: int = Field(..., description="Nombre total de flashcards générées")

@app.post("/flashcards", response_model=FlashCardResponse)
async def generate_flashcards_endpoint(request: FlashCardRequest):
    """
    Endpoint pour générer des flashcards à partir d'un texte
    Utilise Google Gemini API (gratuit, 60 requêtes par minute)
    """
    try:
        # Créer la configuration
        config = FlashCardConfig()
        if request.max_question_words:
            config.set_max_question_words(request.max_question_words)
        if request.max_answer_words:
            config.set_max_answer_words(request.max_answer_words)
        if request.number_of_cards:
            config.set_number_of_cards(request.number_of_cards)
        if request.temperature is not None:
            config.set_temperature(request.temperature)
        
        # Générer les flashcards
        flash_cards = generate_flashcards(request.text, config)
        
        # Convertir en format JSON
        flashcards_data = [card.to_dict() for card in flash_cards]
        
        return FlashCardResponse(
            flashcards=flashcards_data,
            total=len(flashcards_data)
        )
        
    except ValueError as e:
        # Erreur de configuration ou de parsing
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Autres erreurs
        error_msg = str(e)
        print(f"Erreur dans /flashcards: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des flashcards: {error_msg}")
