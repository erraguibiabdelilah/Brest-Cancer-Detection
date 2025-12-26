"""
Configuration de l'application
"""

# Performance - Activer/Désactiver l'IA
# True = Utilise l'IA (plus lent, contenu unique)
# False = Utilise le contenu statique (rapide, contenu prédéfini)
USE_GEMINI_AI = True  # ACTIVÉ - Utilise Gemini AI pour contenu unique

# Si True, l'analyse prendra 5-10 secondes de plus
# Si False, l'analyse sera instantanée (< 2 secondes)

# Pour activer Gemini AI:
# 1. Configurez GEMINI_API_KEY dans .env
# 2. Changez USE_GEMINI_AI = True
# 3. Redémarrez le serveur
