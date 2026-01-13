# 🚀 Guide de démarrage du serveur backend

## ✅ Dépendances installées

Les modules d'authentification sont maintenant installés :
- ✅ passlib[bcrypt]
- ✅ bcrypt
- ✅ python-jose[cryptography]
- ✅ mysql-connector-python
- ✅ fastapi
- ✅ uvicorn

## 🎯 Démarrage du serveur

### Méthode 1 : Utiliser le script Python (RECOMMANDÉ)

```bash
cd /home/abdelilah/Documents/MA_project/Brest-Cancer-Detection/backend
/home/abdelilah/Documents/MA_project/venv/bin/python3 run.py
```

### Méthode 2 : Utiliser uvicorn directement

```bash
cd /home/abdelilah/Documents/MA_project/Brest-Cancer-Detection/backend
/home/abdelilah/Documents/MA_project/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**IMPORTANT** : 
- Utilisez le Python de l'environnement virtuel : `/home/abdelilah/Documents/MA_project/venv/bin/python3`
- Utilisez `--host 0.0.0.0` (pas `localhost`) pour écouter sur toutes les interfaces

## 🔍 Vérification

Une fois le serveur démarré, vous devriez voir :
```
🚀 Démarrage du serveur FastAPI...
✅ Base de données initialisée
🌐 Serveur prêt sur http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Testez dans votre navigateur :
- http://localhost:8000/ → Devrait afficher `{"message": "IDC Breast Cancer Prediction API is running "}`
- http://localhost:8000/docs → Documentation Swagger de l'API

## ⚠️ Note sur les conflits de dépendances

Il y a un avertissement concernant `anyio` (conflit avec google-genai), mais cela ne devrait pas empêcher le serveur de démarrer. Si vous rencontrez des problèmes, vous pouvez ignorer cet avertissement pour l'instant.

## 🛑 Arrêter le serveur

Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne.

