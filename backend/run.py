#!/usr/bin/env python3
"""
Script pour démarrer le serveur FastAPI
Utilisez: /home/abdelilah/Documents/MA_project/venv/bin/python3 run.py
OU: python3 run.py (si vous êtes dans l'environnement virtuel)
"""

import uvicorn
import sys
import os

# Vérifier que nous utilisons le bon Python
VENV_PYTHON = "/home/abdelilah/Documents/MA_project/venv/bin/python3"
if os.path.exists(VENV_PYTHON) and sys.executable != VENV_PYTHON:
    print("⚠️  ATTENTION: Vous n'utilisez pas l'environnement virtuel!")
    print(f"   Python actuel: {sys.executable}")
    print(f"   Python attendu: {VENV_PYTHON}")
    print(f"\n💡 Utilisez: {VENV_PYTHON} run.py")
    print("   OU activez l'environnement virtuel d'abord\n")

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Vérifier que les modules nécessaires sont disponibles
try:
    import passlib
    import jose
    import fastapi
except ImportError as e:
    print(f"❌ Module manquant: {e}")
    print(f"💡 Installez les dépendances avec: {VENV_PYTHON.replace('python3', 'pip')} install -r requirements.txt")
    sys.exit(1)

if __name__ == "__main__":
    print("🚀 Démarrage du serveur FastAPI...")
    print(f"🐍 Python: {sys.executable}")
    print("📡 Le serveur sera accessible sur: http://0.0.0.0:8000")
    print("📝 Documentation API: http://localhost:8000/docs")
    print("🛑 Appuyez sur Ctrl+C pour arrêter le serveur\n")
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",  # Écouter sur toutes les interfaces
            port=8000,
            reload=True,  # Rechargement automatique en cas de modification
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

