# Guide de dépannage CORS

## Problème: "CORS request did not succeed" avec status 0

Ce problème indique généralement que le serveur backend n'est pas accessible depuis le frontend.

## Solutions

### 1. Vérifier que le serveur est démarré

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Important**: Utilisez `--host 0.0.0.0` pour que le serveur écoute sur toutes les interfaces, pas seulement localhost.

### 2. Vérifier que le serveur répond

Ouvrez votre navigateur et allez sur: `http://localhost:8000/`

Vous devriez voir: `{"message": "IDC Breast Cancer Prediction API is running "}`

### 3. Vérifier les logs du serveur

Le serveur devrait afficher les requêtes entrantes dans le terminal. Si vous ne voyez rien, le serveur ne reçoit pas les requêtes.

### 4. Vérifier le port

Assurez-vous que le port 8000 n'est pas utilisé par un autre processus:

```bash
# Linux
lsof -i :8000
# ou
netstat -tulpn | grep 8000
```

### 5. Vérifier la configuration CORS

La configuration actuelle autorise:
- `http://localhost:4200`
- `http://127.0.0.1:4200`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### 6. Vérifier que MySQL est démarré

```bash
sudo systemctl status mysql
# ou
sudo service mysql status
```

### 7. Vérifier la connexion à la base de données

Assurez-vous que la base de données `Bcancer` existe:

```bash
mysql -u root -proot -e "SHOW DATABASES;"
```

### 8. Redémarrer le serveur

Si le serveur était déjà en cours d'exécution, arrêtez-le (Ctrl+C) et redémarrez-le:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 9. Vérifier les erreurs dans la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez les erreurs détaillées.

### 10. Tester avec un outil externe

Si possible, testez l'endpoint avec Postman ou un autre outil pour vérifier que le serveur répond.

## Configuration recommandée

Pour le développement, utilisez:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Cela permet au serveur d'écouter sur toutes les interfaces réseau, ce qui résout souvent les problèmes CORS.

## Si le problème persiste

1. Vérifiez les logs du serveur backend
2. Vérifiez la console du navigateur pour les erreurs détaillées
3. Assurez-vous que le frontend et le backend sont sur les mêmes ports que configurés
4. Vérifiez qu'il n'y a pas de proxy ou de firewall qui bloque les requêtes

