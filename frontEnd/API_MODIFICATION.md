# Modification de l'API FastAPI

Pour que l'application Angular puisse uploader des images, vous devez modifier votre API FastAPI pour accepter les fichiers uploadés via POST.

## Code modifié pour l'API

Remplacez votre endpoint actuel par ce code :

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from script import predict_new_image

app = FastAPI()

# Ajouter CORS pour permettre les requêtes depuis Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # URL de votre app Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Créer un fichier temporaire
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        tmp_path = tmp_file.name
        # Écrire le contenu du fichier uploadé
        content = await file.read()
        tmp_file.write(content)
    
    try:
        # Appeler votre fonction de prédiction
        result = predict_new_image(tmp_path)
        return result
    finally:
        # Nettoyer le fichier temporaire
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
```

## Installation des dépendances

Assurez-vous d'avoir installé python-multipart :

```bash
pip install python-multipart
```

## Notes importantes

1. L'endpoint utilise maintenant `POST /predict` au lieu de `GET /predict/{img_path}`
2. Le CORS est configuré pour permettre les requêtes depuis `http://localhost:4200` (port par défaut d'Angular)
3. Les fichiers sont temporairement sauvegardés, traités, puis supprimés
4. Si vous déployez l'application, modifiez `allow_origins` pour inclure votre URL de production

