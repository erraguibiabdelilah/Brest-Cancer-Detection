# Configuration JWT - Intégration complète

## ✅ JWT est maintenant intégré dans toute l'application

### Backend (FastAPI)

1. **Génération de tokens JWT** (`auth.py`)
   - Les tokens sont générés lors de l'inscription (`/register`) et de la connexion (`/login`)
   - Durée de validité: 7 jours
   - Algorithme: HS256
   - Le token contient l'ID utilisateur et l'email

2. **Vérification des tokens JWT**
   - Fonction `verify_token()` pour valider les tokens
   - Fonction `get_current_user()` comme dépendance FastAPI pour protéger les routes

3. **Routes protégées avec JWT**
   - ✅ `/predict` - Nécessite un token JWT valide
   - ✅ `/me` - Nécessite un token JWT valide
   - ❌ `/register` - Public (pour créer un compte)
   - ❌ `/login` - Public (pour se connecter)

### Frontend (Angular)

1. **Service d'authentification** (`auth.service.ts`)
   - Stocke le token JWT dans `localStorage`
   - Vérifie automatiquement la validité du token au démarrage
   - Méthode `getAuthHeaders()` pour obtenir les headers avec le token

2. **Service API** (`api.service.ts`)
   - Inclut automatiquement le token JWT dans toutes les requêtes vers `/predict`
   - Utilise `AuthService.getAuthHeaders()` pour ajouter le header `Authorization: Bearer <token>`

### Flux d'authentification

1. **Inscription** (`POST /register`)
   ```
   Client → Backend: { email, password, name }
   Backend → Client: { access_token, user }
   Client: Stocke le token dans localStorage
   ```

2. **Connexion** (`POST /login`)
   ```
   Client → Backend: { email, password }
   Backend → Client: { access_token, user }
   Client: Stocke le token dans localStorage
   ```

3. **Requête authentifiée** (ex: `POST /predict`)
   ```
   Client → Backend: 
     Headers: { Authorization: Bearer <token> }
     Body: FormData avec l'image
   Backend: 
     - Vérifie le token JWT
     - Extrait l'utilisateur
     - Traite la requête
   ```

### Configuration de la base de données

- **Nom de la BD**: `Bcancer`
- **Username**: `root`
- **Password**: `root`
- **Host**: `localhost`
- **Port**: `3306`

### Sécurité

✅ Mots de passe hashés avec bcrypt
✅ Tokens JWT signés et vérifiés
✅ Expiration automatique des tokens (7 jours)
✅ Protection des routes sensibles
✅ Validation des tokens à chaque requête authentifiée

### Prochaines étapes (optionnel)

Pour améliorer encore la sécurité:
1. Ajouter un refresh token pour renouveler les tokens expirés
2. Implémenter une blacklist de tokens (pour la déconnexion)
3. Ajouter un rate limiting sur les endpoints d'authentification
4. Utiliser HTTPS en production
5. Changer la clé secrète JWT en production

