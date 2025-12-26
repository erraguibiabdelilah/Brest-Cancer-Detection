"""
Script pour vérifier la configuration de Gemini API
"""
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

print("\n" + "="*60)
print("VÉRIFICATION DE LA CONFIGURATION GEMINI API")
print("="*60 + "\n")

# Vérifier si le fichier .env existe
if os.path.exists('.env'):
    print("✅ Fichier .env trouvé")
else:
    print("❌ Fichier .env non trouvé")
    print("   Créez un fichier .env avec: GEMINI_API_KEY=votre_cle")
    exit(1)

# Vérifier si la clé API est définie
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ GEMINI_API_KEY non définie dans .env")
    print("\n📝 Pour configurer:")
    print("   1. Obtenez une clé: https://makersuite.google.com/app/apikey")
    print("   2. Ouvrez backend/.env")
    print("   3. Remplacez 'your_gemini_api_key_here' par votre clé")
    print("   4. Sauvegardez et relancez ce script\n")
    exit(1)

if api_key == 'your_gemini_api_key_here':
    print("⚠️  GEMINI_API_KEY contient la valeur par défaut")
    print("\n📝 Pour configurer:")
    print("   1. Obtenez une clé: https://makersuite.google.com/app/apikey")
    print("   2. Ouvrez backend/.env")
    print("   3. Remplacez 'your_gemini_api_key_here' par votre vraie clé")
    print("   4. Sauvegardez et relancez ce script\n")
    exit(1)

print(f"✅ GEMINI_API_KEY définie (longueur: {len(api_key)} caractères)")

# Tester la connexion à Gemini
print("\n🔄 Test de connexion à Gemini API...")

try:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    # Test simple
    response = model.generate_content("Dis bonjour en français")
    
    print("✅ Connexion réussie à Gemini API")
    print(f"✅ Réponse de test: {response.text[:50]}...")
    
except Exception as e:
    print(f"❌ Erreur de connexion: {e}")
    print("\n📝 Vérifiez que:")
    print("   1. Votre clé API est valide")
    print("   2. Vous avez installé: pip install google-generativeai")
    print("   3. Vous avez une connexion internet\n")
    exit(1)

print("\n" + "="*60)
print("✅ CONFIGURATION COMPLÈTE ET FONCTIONNELLE")
print("="*60)
print("\n🚀 Vous pouvez maintenant:")
print("   - Tester: python demo_gemini.py")
print("   - Démarrer l'API: python -m uvicorn main:app --reload\n")
