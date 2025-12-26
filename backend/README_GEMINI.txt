CONFIGURATION GEMINI AI POUR RAPPORTS DYNAMIQUES
================================================

Le système utilise maintenant Gemini AI pour générer dynamiquement :
- Interprétations cliniques personnalisées
- Recommandations médicales adaptées
- Observations détaillées

INSTALLATION
------------

1. Installer les dépendances :
   pip install -r requirements.txt

2. Obtenir une clé API Gemini :
   - Visitez : https://makersuite.google.com/app/apikey
   - Créez une clé API gratuite
   - Copiez la clé

3. Configurer la clé API :
   
   Windows (CMD):
   set GEMINI_API_KEY=votre_cle_api_ici
   
   Windows (PowerShell):
   $env:GEMINI_API_KEY="votre_cle_api_ici"
   
   Linux/Mac:
   export GEMINI_API_KEY='votre_cle_api_ici'
   
   Ou créer un fichier .env :
   GEMINI_API_KEY=votre_cle_api_ici

4. Tester l'installation :
   python test_dynamic_report.py

DÉMARRAGE
---------

1. Avec Gemini AI :
   set GEMINI_API_KEY=votre_cle
   uvicorn main:app --reload

2. Sans Gemini (mode fallback) :
   uvicorn main:app --reload
   
   Le système utilisera du contenu statique prédéfini

FONCTIONNEMENT
--------------

Avec Gemini AI activé :
✅ Chaque rapport est unique et personnalisé
✅ Le contenu s'adapte au score de confiance
✅ Les recommandations sont contextuelles
✅ Les observations sont détaillées et médicales

Sans Gemini AI :
⚠️  Utilise du contenu statique prédéfini
⚠️  Fonctionne mais moins personnalisé

AVANTAGES GEMINI AI
-------------------

1. Contenu unique pour chaque analyse
2. Adaptation au contexte médical
3. Vocabulaire médical professionnel
4. Recommandations pertinentes
5. Interprétations nuancées selon la confiance

COÛT
----

Gemini API offre un quota gratuit généreux :
- 60 requêtes par minute
- Suffisant pour la plupart des usages

DÉPANNAGE
---------

Erreur "GEMINI_API_KEY not found" :
→ Vérifiez que la variable d'environnement est définie
→ Redémarrez le terminal après configuration

Erreur "API key invalid" :
→ Vérifiez que la clé est correcte
→ Générez une nouvelle clé si nécessaire

Le système utilise du contenu statique :
→ Normal si GEMINI_API_KEY n'est pas configurée
→ Configurez la clé pour activer l'IA

SÉCURITÉ
--------

⚠️  Ne commitez JAMAIS votre clé API dans Git
⚠️  Utilisez des variables d'environnement
⚠️  Ajoutez .env au .gitignore
