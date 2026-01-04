# API d'authentification

Cette API fournit des endpoints pour l'authentification des utilisateurs avec MySQL.

## Endpoints disponibles

### 1. POST /register
Crée un nouveau compte utilisateur.

**Requête:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "name": "Nom de l'utilisateur"
}
```

**Réponse (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nom de l'utilisateur"
  }
}
```

**Erreurs:**
- 400: Email déjà utilisé
- 422: Données invalides (email invalide, mot de passe trop court, etc.)

### 2. POST /login
Connecte un utilisateur existant.

**Requête:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nom de l'utilisateur"
  }
}
```

**Erreurs:**
- 401: Email ou mot de passe incorrect

### 3. GET /me
Récupère les informations de l'utilisateur actuellement connecté.

**Headers requis:**
```
Authorization: Bearer <access_token>
```

**Réponse (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Nom de l'utilisateur"
}
```

**Erreurs:**
- 401: Token invalide ou expiré

## Sécurité

- Les mots de passe sont hashés avec bcrypt avant d'être stockés
- Les tokens JWT expirent après 7 jours
- Utilisez HTTPS en production
- Changez la clé secrète JWT en production

## Utilisation avec le frontend

Le service `AuthService` dans le frontend Angular est déjà configuré pour utiliser ces endpoints. Il gère automatiquement:
- Le stockage du token dans localStorage
- L'envoi du token dans les headers pour les requêtes authentifiées
- La vérification de la validité du token au démarrage

