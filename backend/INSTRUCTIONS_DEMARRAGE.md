# 🚀 Instructions de démarrage - IMPORTANT

## ⚠️ PROBLÈME RÉSOLU

Le problème était que le script utilisait le Python système au lieu de celui de l'environnement virtuel.

## ✅ SOLUTION - Utilisez UNE de ces méthodes :

### Méthode 1 : Script shell (LE PLUS SIMPLE) ⭐

```bash
cd /home/abdelilah/Documents/MA_project/Brest-Cancer-Detection/backend
./start.sh
```

### Méthode 2 : Python de l'environnement virtuel directement

```bash
cd /home/abdelilah/Documents/MA_project/Brest-Cancer-Detection/backend
/home/abdelilah/Documents/MA_project/venv/bin/python3 run.py
```

### Méthode 3 : Uvicorn directement

```bash
cd /home/abdelilah/Documents/MA_project/Brest-Cancer-Detection/backend
/home/abdelilah/Documents/MA_project/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## ❌ NE PAS UTILISER :

```bash
# ❌ Ceci NE FONCTIONNERA PAS (utilise le Python système)
python3 run.py

# ❌ Ceci NE FONCTIONNERA PAS non plus
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔍 Pourquoi ?

- Le Python système (`/usr/bin/python3`) n'a **PAS** les modules installés (passlib, etc.)
- L'environnement virtuel (`/home/abdelilah/Documents/MA_project/venv/bin/python3`) **A** tous les modules

## ✅ Vérification

Après le démarrage, vous devriez voir :
```
🚀 Démarrage du serveur FastAPI...
🐍 Python: /home/abdelilah/Documents/MA_project/venv/bin/python3
📡 Le serveur sera accessible sur: http://0.0.0.0:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🎯 Test

Ouvrez votre navigateur :
- http://localhost:8000/ → Devrait afficher `{"message": "IDC Breast Cancer Prediction API is running "}`
- http://localhost:8000/docs → Documentation Swagger

Une fois le serveur démarré, l'erreur CORS devrait disparaître !

