#!/bin/bash
# Script pour démarrer le serveur avec le bon environnement virtuel

cd "$(dirname "$0")"
VENV_PYTHON="/home/abdelilah/Documents/MA_project/venv/bin/python3"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "❌ Environnement virtuel non trouvé: $VENV_PYTHON"
    exit 1
fi

echo "🚀 Démarrage du serveur FastAPI..."
echo "🐍 Utilisation de: $VENV_PYTHON"
echo ""

$VENV_PYTHON run.py

