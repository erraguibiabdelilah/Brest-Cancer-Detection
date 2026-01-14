# Application de Détection du Cancer du Sein (IDC)

Application web complète pour la détection du cancer du sein (IDC) utilisant l'intelligence artificielle. Le projet se compose d'un backend FastAPI avec un modèle TensorFlow/ResNet50 et d'un frontend Angular.

## 🏗️ Structure du Projet

```
Brest-Cancer-Detection/
├── backend/              # API FastAPI avec modèle TensorFlow
│   ├── main.py          # Point d'entrée de l'API
│   ├── script.py        # Logique de prédiction avec ResNet50
│   └── idc_breast_cancer_model_final/  # Modèle entraîné
│       └── model.weights.h5
└── frontEnd/            # Application Angular
    └── src/
```

## 📋 Prérequis

### Pour le Backend
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Pour le Frontend
- Node.js (version 18 ou supérieure)
- npm (vient avec Node.js)

## 🚀 Installation et Lancement

### 1. Backend (API FastAPI)

#### Étape 1 : Aller dans le dossier backend
```bash
cd backend
```

#### Étape 2 : Créer un environnement virtuel (recommandé)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Étape 3 : Installer les dépendances
```bash
pip install -r requirements.txt
# ou manuellement :
pip install fastapi uvicorn[standard] tensorflow opencv-python numpy python-multipart python-dotenv google-generativeai mysql-connector-python bcrypt python-jose passlib email-validator requests
```

#### Étape 4 : Configurer la base de données MySQL

1. **Installer MySQL** (si ce n'est pas déjà fait)
   - Windows : Téléchargez depuis [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
   - Linux : `sudo apt-get install mysql-server` (Ubuntu/Debian) ou `sudo yum install mysql-server` (CentOS/RHEL)
   - Mac : `brew install mysql`

2. **Démarrer le service MySQL**
   ```bash
   # Linux
   sudo systemctl start mysql
   # ou
   sudo service mysql start
   
   # Mac
   brew services start mysql
   
   # Windows : Démarrez MySQL depuis les Services Windows
   ```

3. **Créer la base de données**
   ```bash
   mysql -u root -p
   ```
   Puis dans MySQL :
   ```sql
   CREATE DATABASE IF NOT EXISTS agileDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

#### Étape 5 : Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` :

```env
# Configuration de la base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=abdelilah
DB_PASSWORD=root
DB_NAME=agileDb

# Clé secrète pour JWT (générez une clé sécurisée)
JWT_SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire-changez-en-production

# Token GitHub pour l'API GitHub Models (génération de rapports médicaux)
# Obtenez votre token sur https://github.com/settings/tokens
# Créez un token avec les permissions "read:packages" et "write:packages"
GITHUB_TOKEN=votre_token_github_ici

# Configuration Azure AI Inference pour le chatbot
AZURE_AI_INFERENCE_ENDPOINT=https://models.github.ai/inference/chat/completions
AZURE_AI_INFERENCE_MODEL=openai/gpt-4.1-mini
```

**Important** : 
- Le fichier `.env` est déjà dans `.gitignore` et ne sera pas commité
- Générez une clé JWT sécurisée avec : `openssl rand -hex 32`
- Pour obtenir un token GitHub : Allez sur [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) et créez un nouveau token

#### Étape 6 : Lancer le serveur
```bash
uvicorn main:app --reload --port 8000
```

Le backend sera accessible sur `http://localhost:8000`

📝 **Note**: Le modèle sera chargé au démarrage. Attendez le message "Modèle chargé avec succès" avant d'utiliser l'API.

#### Vérification
Vous pouvez tester l'API en visitant: `http://localhost:8000` (devrait afficher un message JSON)

Documentation interactive de l'API: `http://localhost:8000/docs`

---

### 2. Frontend (Application Angular)

#### Étape 1 : Aller dans le dossier frontend
```bash
cd frontEnd
```

#### Étape 2 : Installer les dépendances
```bash
npm install
```

#### Étape 3 : Configurer le token GitHub (pour la génération de rapports médicaux)

**Option 1 : Utiliser un fichier .env (Recommandé)**

Créez un fichier `.env` dans le dossier `frontEnd/` :

```env
# Token GitHub pour l'API GitHub Models
# Obtenez votre token sur https://github.com/settings/tokens
NG_APP_GITHUB_TOKEN=votre_token_github_ici
```

Puis modifiez le fichier `frontEnd/src/environments/environment.ts` pour utiliser le token :
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  githubToken: 'votre_token_github_ici' // Remplacez par votre token
};
```

**Option 2 : Utiliser un fichier de configuration JSON**

Créez un fichier `frontEnd/public/assets/config.json` :

```json
{
  "githubToken": "votre_token_github_ici"
}
```

**Important** :
- Le fichier `.env` est dans `.gitignore` et ne sera pas commité
- Le fichier `config.json` doit être ajouté à `.gitignore` s'il contient des secrets
- Pour obtenir un token GitHub : Allez sur [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) et créez un nouveau token avec les permissions `read:packages` et `write:packages`
- Redémarrez le serveur de développement après avoir configuré le token

#### Étape 4 : Lancer le serveur de développement
```bash
npm start
# ou
ng serve
```

Le frontend sera accessible sur `http://localhost:4200`

---

## 🔄 Lancement Complet

Pour utiliser l'application complète, vous devez lancer **les deux serveurs en parallèle** :

### Terminal 1 - Backend
```bash
cd backend
# Activer l'environnement virtuel si vous en avez créé un
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

uvicorn main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontEnd
npm start
```

## 📡 Configuration de l'API

- **Backend URL**: `http://localhost:8000`
- **Frontend URL**: `http://localhost:4200`
- **Endpoint de prédiction**: `POST http://localhost:8000/predict`

Le backend est configuré pour accepter les requêtes CORS depuis `http://localhost:4200`.

## 🧪 Test de l'Application

1. Assurez-vous que les deux serveurs sont lancés
2. Ouvrez votre navigateur sur `http://localhost:4200`
3. Uploadez une image histopathologique
4. Obtenez la prédiction avec le niveau de confiance

## 📦 Dépendances Principales

### Backend
- `fastapi`: Framework web moderne pour Python
- `uvicorn`: Serveur ASGI
- `tensorflow`: Framework de machine learning
- `opencv-python`: Traitement d'images
- `numpy`: Calculs numériques
- `python-multipart`: Support des uploads de fichiers
- `python-dotenv`: Gestion des variables d'environnement
- `google-generativeai`: API Google Gemini pour la génération de flashcards

### Frontend
- `@angular/core`: Framework Angular
- `@angular/common`: Utilitaires Angular
- `rxjs`: Programmation réactive
- `jspdf`: Génération de PDF

## ⚠️ Notes Importantes

1. **Premier démarrage**: Le chargement du modèle TensorFlow peut prendre quelques secondes
2. **Mémoire**: Le modèle nécessite de la RAM disponible (recommandé: 4GB+)
3. **Formats d'images**: L'application accepte les images au format PNG, JPG, JPEG

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifiez que le port 8000 n'est pas déjà utilisé
- Vérifiez que toutes les dépendances sont installées
- Vérifiez que le fichier `model.weights.h5` existe dans `backend/idc_breast_cancer_model_final/`

### Frontend ne se connecte pas à l'API
- Vérifiez que le backend est lancé sur le port 8000
- Vérifiez la configuration CORS dans `backend/main.py`
- Vérifiez l'URL de l'API dans `frontEnd/src/app/services/api.service.ts`

### Erreur "Module not found"
- Réinstallez les dépendances avec `pip install -r requirements.txt` (si le fichier existe)
- Ou installez manuellement toutes les dépendances listées ci-dessus

## 🔑 Configuration des API

### 🤖 Configuration Google Gemini API

L'API Google Gemini est utilisée pour la génération de flashcards.

### ✅ Avantages
- **100% gratuit** : 60 requêtes par minute
- **Pas de carte bancaire** requise
- **Très intelligent** : Comparable à GPT-4
- **Gratuit à long terme**

### 🔑 Configuration

1. **Obtenez une clé API** sur [Google AI Studio](https://ai.google.dev/)
2. **Ajoutez votre clé API** dans le fichier `.env` du backend :
   ```env
   GEMINI_API_KEY=votre_cle_api_ici
   ```

### 🐙 Configuration GitHub Models API

L'API GitHub Models est utilisée pour :
- La génération de rapports médicaux détaillés (frontend)
- Le chatbot médical intelligent (backend)

### 🔑 Configuration

1. **Obtenez un token GitHub** :
   - Allez sur [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Cliquez sur "Generate new token (classic)"
   - Donnez un nom au token (ex: "BreastCare AI")
   - Sélectionnez les permissions : `read:packages` et `write:packages`
   - Cliquez sur "Generate token"
   - **Copiez le token immédiatement** (il ne sera plus visible après)

2. **Backend** : Ajoutez le token dans `backend/.env` :
   ```env
   GITHUB_TOKEN=votre_token_github_ici
   ```

3. **Frontend** : Ajoutez le token dans `frontEnd/.env` :
   ```env
   NG_APP_GITHUB_TOKEN=votre_token_github_ici
   ```

⚠️ **Important** : 
- Les fichiers `.env` sont dans `.gitignore` et ne seront pas commités
- Ne partagez jamais vos tokens publiquement
- Si un token est compromis, révoquez-le immédiatement sur GitHub

