# Configuration de l'environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes:

```env
# Configuration de la base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=Bcancer

# Clé secrète pour JWT (changez-la en production!)
JWT_SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire-changez-en-production
```

## Instructions de configuration

1. Créez le fichier `.env` dans le dossier `backend/` (optionnel, les valeurs par défaut sont déjà configurées)
2. Les valeurs par défaut sont:
   - **DB_USER**: root
   - **DB_PASSWORD**: root
   - **DB_NAME**: Bcancer
3. Générez une clé secrète JWT sécurisée (vous pouvez utiliser: `openssl rand -hex 32`)
4. Assurez-vous que MySQL est installé et en cours d'exécution
5. Créez la base de données MySQL (exécutez le script `init_database.sql` ou créez-la manuellement)

## Création de la base de données MySQL

```sql
CREATE DATABASE IF NOT EXISTS Bcancer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ou exécutez le script:
```bash
mysql -u root -proot < init_database.sql
```

