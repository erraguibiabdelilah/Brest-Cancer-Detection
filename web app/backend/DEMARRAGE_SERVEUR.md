# 🚀 Guide de démarrage du serveur backend

## ⚠️ PROBLÈME ACTUEL

Le serveur backend **n'est PAS en cours d'exécution**. C'est pour cela que vous obtenez l'erreur CORS avec status 0.

## ✅ SOLUTION RAPIDE

### Option 1: Utiliser le script Python (RECOMMANDÉ)

```bash
cd backend
python3 run.py
```

### Option 2: Utiliser uvicorn directement

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**IMPORTANT**: Utilisez `--host 0.0.0.0` (pas `localhost`) pour que le serveur écoute sur toutes les interfaces.

### Option 3: Utiliser le script shell

```bash
cd backend
./start_server.sh
```

## 📋 Vérifications

### 1. Vérifier que le serveur est démarré

Ouvrez votre navigateur et allez sur: **http://localhost:8000/**

Vous devriez voir:
```json
{"message": "IDC Breast Cancer Prediction API is running "}
```

### 2. Vérifier la documentation API

Allez sur: **http://localhost:8000/docs**

Vous devriez voir l'interface Swagger de FastAPI.

### 3. Vérifier que MySQL est démarré

```bash
sudo systemctl status mysql
# ou
sudo service mysql status
```

### 4. Vérifier que la base de données existe

```bash
mysql -u root -proot -e "SHOW DATABASES;"
```

Si la base `Bcancer` n'existe pas, créez-la:

```bash
mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS Bcancer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 🔧 Configuration CORS

La configuration CORS a été simplifiée pour autoriser toutes les origines en développement. Cela devrait résoudre les problèmes CORS.

## 📝 Logs

Quand le serveur démarre, vous devriez voir dans le terminal:
```
🚀 Démarrage du serveur FastAPI...
✅ Base de données initialisée
🌐 Serveur prêt sur http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ❌ Si le serveur ne démarre pas

1. **Vérifiez les dépendances:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Vérifiez les erreurs dans le terminal** - elles indiqueront le problème

3. **Vérifiez que le port 8000 est libre:**
   ```bash
   lsof -i :8000
   # ou
   netstat -tuln | grep 8000
   ```

4. **Vérifiez la connexion MySQL:**
   ```bash
   mysql -u root -proot -e "SELECT 1;"
   ```

## 🎯 Après le démarrage

Une fois le serveur démarré, testez la connexion depuis le frontend. L'erreur CORS devrait disparaître.

