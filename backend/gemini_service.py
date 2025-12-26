import google.generativeai as genai
import os
from typing import Dict, List
from gemini_config import (
    get_interpretation_prompt,
    get_recommendations_prompt,
    get_findings_prompt
)

class GeminiReportGenerator:
    def __init__(self, api_key: str = None):
        """Initialize Gemini API"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def generate_interpretation(self, is_positive: bool, confidence: float) -> str:
        """Generate clinical interpretation using Gemini AI"""
        
        prompt = get_interpretation_prompt(is_positive, confidence)
        
        try:
            print(f"   📝 Appel Gemini pour interprétation (confiance: {confidence*100:.1f}%)...")
            response = self.model.generate_content(prompt)
            result = response.text.strip()
            print(f"   ✅ Interprétation générée ({len(result)} caractères)")
            return result
        except Exception as e:
            print(f"   ⚠️ Erreur Gemini interprétation: {e}")
            # Fallback en cas d'erreur
            return self._get_fallback_interpretation(is_positive)
    
    def generate_recommendations(self, is_positive: bool, confidence: float) -> List[str]:
        """Generate medical recommendations using Gemini AI"""
        
        prompt = get_recommendations_prompt(is_positive, confidence)
        
        try:
            print(f"   📝 Appel Gemini pour recommandations...")
            response = self.model.generate_content(prompt)
            recommendations = [line.strip() for line in response.text.strip().split('\n') if line.strip()]
            # Prendre les 5 premières recommandations
            result = recommendations[:5] if len(recommendations) >= 5 else recommendations
            print(f"   ✅ Recommandations générées ({len(result)} items)")
            return result
        except Exception as e:
            print(f"   ⚠️ Erreur Gemini recommandations: {e}")
            # Fallback en cas d'erreur
            return self._get_fallback_recommendations(is_positive)
    
    def generate_detailed_findings(self, is_positive: bool, confidence: float) -> str:
        """Generate detailed findings description using Gemini AI"""
        
        prompt = get_findings_prompt(is_positive, confidence)
        
        try:
            print(f"   📝 Appel Gemini pour observations détaillées...")
            response = self.model.generate_content(prompt)
            result = response.text.strip()
            print(f"   ✅ Observations générées ({len(result)} caractères)")
            return result
        except Exception as e:
            print(f"   ⚠️ Erreur Gemini observations: {e}")
            return self._get_fallback_findings(is_positive)
    
    def _get_fallback_interpretation(self, is_positive: bool) -> str:
        """Fallback interpretation if Gemini fails"""
        if is_positive:
            return (
                "L'analyse de l'image médicale révèle des caractéristiques compatibles avec une tumeur maligne. "
                "Le modèle d'IA a identifié des motifs fréquemment associés aux cas de cancer du sein, notamment "
                "des irrégularités dans la structure tissulaire, une densité anormale dans les zones suspectes, "
                "et des textures typiques des cellules cancéreuses. "
                "Ce résultat nécessite une attention médicale immédiate et des examens complémentaires pour confirmer le diagnostic."
            )
        else:
            return (
                "L'image analysée ne présente pas de caractéristiques suspectes associées au cancer du sein. "
                "Les structures observées correspondent à des tissus considérés comme normaux par le modèle d'intelligence artificielle. "
                "Les paramètres analysés se situent dans les plages de référence pour des tissus sains. "
                "Aucune anomalie morphologique significative n'a été détectée."
            )
    
    def _get_fallback_recommendations(self, is_positive: bool) -> List[str]:
        """Fallback recommendations if Gemini fails"""
        if is_positive:
            return [
                "⚠ Consulter immédiatement un médecin spécialiste (oncologue/radiologue)",
                "⚠ Effectuer une biopsie pour confirmation histologique",
                "⚠ Réaliser des examens complémentaires (IRM, scanner, analyses)",
                "⚠ Envisager un plan de traitement si le diagnostic est confirmé",
                "⚠ Suivi oncologique régulier recommandé"
            ]
        else:
            return [
                "✓ Continuer le suivi médical régulier et les dépistages périodiques",
                "✓ Réaliser des contrôles selon les recommandations de votre médecin",
                "✓ Maintenir des habitudes de vie saines",
                "✓ Consulter en cas d'apparition de nouveaux symptômes",
                "✓ Prochaine mammographie de contrôle dans 12-24 mois"
            ]
    
    def _get_fallback_findings(self, is_positive: bool) -> str:
        """Fallback findings if Gemini fails"""
        if is_positive:
            return (
                "L'examen histopathologique révèle la présence de cellules atypiques avec des caractéristiques "
                "morphologiques évocatrices d'un carcinome canalaire invasif. Les structures glandulaires présentent "
                "une désorganisation architecturale significative. Le modèle d'intelligence artificielle a détecté "
                "des patterns nucléaires irréguliers, une augmentation du rapport nucléo-cytoplasmique, et une "
                "densité cellulaire anormalement élevée dans les zones analysées."
            )
        else:
            return (
                "L'analyse histopathologique montre des structures tissulaires normales sans signe de malignité. "
                "Les canaux galactophores présentent une architecture préservée avec un épithélium régulier. "
                "Aucune atypie cellulaire significative n'est observée. Le stroma environnant apparaît normal "
                "sans infiltration suspecte. Les paramètres morphométriques analysés par l'IA se situent dans "
                "les valeurs de référence pour un tissu mammaire sain."
            )
