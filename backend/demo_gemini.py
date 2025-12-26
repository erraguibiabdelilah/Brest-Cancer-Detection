"""
Démonstration de la génération de rapports avec Gemini AI
"""
import os
from gemini_service import GeminiReportGenerator

def demo_positive_case():
    """Démo d'un cas positif"""
    print("\n" + "="*70)
    print("DÉMONSTRATION - CAS POSITIF (Cancer détecté)")
    print("="*70)
    
    confidence = 0.95
    is_positive = True
    
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  GEMINI_API_KEY non configurée - Utilisation du contenu fallback")
        print("   Pour activer l'IA, configurez votre clé API\n")
        return
    
    try:
        gemini = GeminiReportGenerator()
        
        print("\n🤖 Génération de l'interprétation clinique...")
        interpretation = gemini.generate_interpretation(is_positive, confidence)
        print("\n📝 INTERPRÉTATION CLINIQUE:")
        print("-" * 70)
        print(interpretation)
        
        print("\n🤖 Génération des recommandations...")
        recommendations = gemini.generate_recommendations(is_positive, confidence)
        print("\n💊 RECOMMANDATIONS MÉDICALES:")
        print("-" * 70)
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        print("\n🤖 Génération des observations détaillées...")
        findings = gemini.generate_detailed_findings(is_positive, confidence)
        print("\n🔬 OBSERVATIONS DÉTAILLÉES:")
        print("-" * 70)
        print(findings)
        
        print("\n✅ Génération terminée avec succès!")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")

def demo_negative_case():
    """Démo d'un cas négatif"""
    print("\n" + "="*70)
    print("DÉMONSTRATION - CAS NÉGATIF (Pas de cancer)")
    print("="*70)
    
    confidence = 0.05
    is_positive = False
    
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  GEMINI_API_KEY non configurée - Utilisation du contenu fallback")
        print("   Pour activer l'IA, configurez votre clé API\n")
        return
    
    try:
        gemini = GeminiReportGenerator()
        
        print("\n🤖 Génération de l'interprétation clinique...")
        interpretation = gemini.generate_interpretation(is_positive, confidence)
        print("\n📝 INTERPRÉTATION CLINIQUE:")
        print("-" * 70)
        print(interpretation)
        
        print("\n🤖 Génération des recommandations...")
        recommendations = gemini.generate_recommendations(is_positive, confidence)
        print("\n💊 RECOMMANDATIONS MÉDICALES:")
        print("-" * 70)
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        print("\n🤖 Génération des observations détaillées...")
        findings = gemini.generate_detailed_findings(is_positive, confidence)
        print("\n🔬 OBSERVATIONS DÉTAILLÉES:")
        print("-" * 70)
        print(findings)
        
        print("\n✅ Génération terminée avec succès!")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("DÉMONSTRATION GEMINI AI - GÉNÉRATION DE RAPPORTS MÉDICAUX")
    print("="*70)
    
    if not os.getenv('GEMINI_API_KEY'):
        print("\n⚠️  Configuration requise:")
        print("   1. Obtenez une clé API: https://makersuite.google.com/app/apikey")
        print("   2. Configurez-la:")
        print("      Windows: set GEMINI_API_KEY=votre_cle")
        print("      Linux/Mac: export GEMINI_API_KEY='votre_cle'")
        print("   3. Relancez ce script\n")
    else:
        print("\n✅ GEMINI_API_KEY configurée")
        print("✅ Prêt à générer du contenu avec l'IA\n")
    
    # Démo cas positif
    demo_positive_case()
    
    # Démo cas négatif
    demo_negative_case()
    
    print("\n" + "="*70)
    print("FIN DE LA DÉMONSTRATION")
    print("="*70 + "\n")
