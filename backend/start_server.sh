#!/bin/bash

# Script pour démarrer le serveur FastAPI

echo "🚀 Démarrage du serveur FastAPI..."

# Utiliser l'environnement virtuel du projet parent
VENV_PATH="/home/abdelilah/Documents/MA_project/venv"

if [ -d "$VENV_PATH" ]; then
    echo "📦 Utilisation de l'environnement virtuel: $VENV_PATH"
    PYTHON="$VENV_PATH/bin/python3"
    UVICORN="$VENV_PATH/bin/uvicorn"
else
    echo "⚠️  Environnement virtuel non trouvé, utilisation de python3 système"
    PYTHON="python3"
    UVICORN="uvicorn"
fi

# Vérifier si les dépendances sont installées
echo "🔍 Vérification des dépendances..."
$PYTHON -c "import fastapi, uvicorn, passlib, jose" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Certaines dépendances ne sont pas installées."
    echo "💡 Installez-les avec: $VENV_PATH/bin/pip install -r requirements.txt"
    exit 1
fi

# Démarrer le serveur
echo "🌐 Démarrage du serveur sur http://0.0.0.0:8000..."
echo "📝 Documentation API: http://localhost:8000/docs"
echo "🛑 Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""
$UVICORN main:app --host 0.0.0.0 --port 8000 --reload

