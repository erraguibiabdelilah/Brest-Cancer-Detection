"""
Script de test pour vérifier la génération dynamique des rapports avec Gemini AI
"""
import json
from script import predict_from_bytes
from pathlib import Path
import os

def test_dynamic_response():
    """Test que la réponse contient tous les champs dynamiques"""
    
    # Vérifier la clé API Gemini
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  WARNING: GEMINI_API_KEY not set in environment")
        print("   Set it with: export GEMINI_API_KEY='your_key_here'")
        print("   Get your key from: https://makersuite.google.com/app/apikey")
        print("   The system will use fallback static content\n")
    
    # Charger une image de test
    test_image_path = Path("../1/9346_idx5_x1051_y1351_class1.png")
    
    if not test_image_path.exists():
        print("❌ Image de test non trouvée")
        return False
    
    with open(test_image_path, 'rb') as f:
        image_bytes = f.read()
    
    # Faire la prédiction
    print("\n🔄 Running prediction with AI-generated content...")
    result = predict_from_bytes(image_bytes)
    
    # Vérifier la structure de la réponse
    required_fields = [
        'label',
        'confidence',
        'is_positive',
        'confidence_level',
        'interpretation',
        'recommendations',
        'detailed_findings',
        'model_performance',
        'model_version',
        'image_type'
    ]
    
    print("\n" + "="*60)
    print("TEST DE LA RÉPONSE DYNAMIQUE (GEMINI AI)")
    print("="*60)
    
    all_fields_present = True
    for field in required_fields:
        if field in result:
            print(f"✅ {field}: présent")
        else:
            print(f"❌ {field}: MANQUANT")
            all_fields_present = False
    
    print("\n" + "="*60)
    print("CONTENU GÉNÉRÉ PAR L'IA")
    print("="*60)
    
    print("\n📝 INTERPRÉTATION CLINIQUE:")
    print("-" * 60)
    print(result.get('interpretation', 'N/A'))
    
    print("\n💊 RECOMMANDATIONS:")
    print("-" * 60)
    for i, rec in enumerate(result.get('recommendations', []), 1):
        print(f"{i}. {rec}")
    
    print("\n🔬 OBSERVATIONS DÉTAILLÉES:")
    print("-" * 60)
    print(result.get('detailed_findings', 'N/A'))
    
    print("\n" + "="*60)
    print("VÉRIFICATIONS SPÉCIFIQUES")
    print("="*60)
    
    # Vérifier que les recommandations sont une liste
    if isinstance(result.get('recommendations'), list):
        print(f"✅ Recommendations est une liste avec {len(result['recommendations'])} éléments")
    else:
        print("❌ Recommendations n'est pas une liste")
        all_fields_present = False
    
    # Vérifier que model_performance est un dict
    if isinstance(result.get('model_performance'), dict):
        print(f"✅ Model performance est un dictionnaire avec {len(result['model_performance'])} clés")
    else:
        print("❌ Model performance n'est pas un dictionnaire")
        all_fields_present = False
    
    # Vérifier que l'interprétation n'est pas vide
    if result.get('interpretation') and len(result['interpretation']) > 50:
        print(f"✅ Interprétation contient {len(result['interpretation'])} caractères")
    else:
        print("❌ Interprétation trop courte ou vide")
        all_fields_present = False
    
    # Vérifier que detailed_findings existe
    if result.get('detailed_findings') and len(result['detailed_findings']) > 50:
        print(f"✅ Detailed findings contient {len(result['detailed_findings'])} caractères")
    else:
        print("❌ Detailed findings trop court ou vide")
        all_fields_present = False
    
    print("\n" + "="*60)
    if all_fields_present:
        print("✅ TOUS LES TESTS SONT PASSÉS")
        if os.getenv('GEMINI_API_KEY'):
            print("🤖 Contenu généré par Gemini AI")
        else:
            print("⚠️  Contenu statique (fallback) - Configurez GEMINI_API_KEY pour l'IA")
    else:
        print("❌ CERTAINS TESTS ONT ÉCHOUÉ")
    print("="*60 + "\n")
    
    return all_fields_present

if __name__ == "__main__":
    test_dynamic_response()
