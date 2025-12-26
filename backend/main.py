from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from script import predict_from_bytes
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Breast Cancer API",
    description="API de prédiction IDC avec ResNet50 et génération de rapports par Gemini AI",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = predict_from_bytes(image_bytes)
    return  result
    

@app.get("/")
def home():
    return {"message": "IDC Breast Cancer Prediction API is running "}
