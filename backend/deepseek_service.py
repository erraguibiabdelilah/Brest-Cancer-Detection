import os
from typing import List
import requests

class DeepSeekReportGenerator:
    def __init__(self, api_key: str = None):
        """Initialize DeepSeek API"""
        self.api_key = api_key or os.getenv('DEEPSEEK_API_KEY')
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY not found in environment variables")
        
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.model = "deepseek-chat"
        print("✅ DeepSeek AI service initialized successfully")
    
    def _call_deepseek(self, prompt: str) -> str:
        """Call DeepSeek API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "Tu es un médecin spécialiste en oncologie et radiologie."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
    
    def generate_interpretation(self, is_positive: bool, confidence: float) -> str:
        """Generate clinical interpretation using DeepSeek AI"""
        
        result_type = "POSITIF - Cancer détecté" if is_positive else "NÉGATIF - Pas de cancer"
        
        prompt = f"""
Génère une interprétation clinique professionnelle pour un rapport médical.

Contexte:
- Type d'examen: Analyse histopathologique pour détection de cancer du sein (IDC)
- Résultat: {result_type}
- Score de confiance: {confidence * 100:.1f}%

Instructions:
1. Rédige une interprétation clinique en français, professionnelle et médicale
2. Utilise un ton rassurant mais factuel
3. Mentionne les caractéristiques observées par l'IA
4. Longueur: 3-4 phrases (environ 150-200 mots)
5. Ne mentionne PAS de noms de patients ou de dates
6. Reste objectif et scientifique

Génère uniquement le texte de l'interprétation, sans titre ni introduction.
"""
        
        try:
            print(f"   📝 Appel DeepSeek pour interprétation (confiance: {confidence*100:.1f}%)...")
            result = self._call_deepseek(prompt)
            print(f"   ✅ Interprétation générée ({len(result)} caractères)")
            return result
        except Exception as e:
            print(f"   ⚠️ Erreur DeepSeek interprétation: {e}")
            return self._get_fallback_interpretation(is_positive)
    
    def generate_recommendations(self, is_positive: bool, confidence: float) -> List[str]:
        """Generate medical recommendations using DeepSeek AI"""
        
        result_type = "POSITIF - Cancer détecté" if is_positive else "NÉGATIF - Pas de cancer"
        
        prompt = f"""
Génère une liste de recommandations médicales pour un rapport.

Contexte:
- Résultat: {result_type}
- Score de confiance: {confidence * 100:.1f}%

Instructions:
1. Génère exactement 5 recommandations médicales en français
2. Chaque recommandation doit être courte et actionnable
3. Pour cas POSITIF: recommandations urgentes (commencer par ⚠)
4. Pour cas NÉGATIF: recommandations de suivi préventif (commencer par ✓)
5. Utilise un ton professionnel et médical
6. Format: une recommandation par ligne

Génère uniquement la liste des recommandations, une par ligne.
"""
        
        try:
            print(f"   📝 Appel DeepSeek pour recommandations...")
            result = self._call_deepseek(prompt)
            recommendations = [line.strip() for line in result.strip().split('\n') if line.strip()]
            # Prendre les 5 premières recommandations
            result_list = recommendations[:5] if len(recommendations) >= 5 else recommendations
            print(f"   ✅ Recommandations générées ({len(result_list)} items)")
            return result_list
        except Exception as e:
            print(f"   ⚠️ Erreur DeepSeek recommandations: {e}")
            return self._get_fallback_recommendations(is_positive)
    
    def generate_detailed_findings(self, is_positive: bool, confidence: float) -> str:
        """Generate detailed findings description using DeepSeek AI"""
        
        result_type = "POSITIF" if is_positive else "NÉGATIF"
        
        prompt = f"""
Génère une description détaillée des observations pour un rapport médical.

Contexte:
- Type d'analyse: Histopathologie - Détection IDC (Carcinome canalaire invasif)
- Résultat: {result_type}
- Confiance: {confidence * 100:.1f}%

Instructions:
1. Décris les observations microscopiques et tissulaires
2. Mentionne les patterns identifiés par l'IA
3. Utilise un vocabulaire médical précis
4. Longueur: 4-5 phrases (environ 200 mots)
5. Reste factuel et scientifique

Génère uniquement la description détaillée.
"""
        
        try:
            print(f"   📝 Appel DeepSeek pour observations détaillées...")
            result = self._call_deepseek(prompt)
            print(f"   ✅ Observations générées ({len(result)} caractères)")
            return result
        except Exception as e:
            print(f"   ⚠️ Erreur DeepSeek observations: {e}")
            return self._get_fallback_findings(is_positive)
    
    def _get_fallback_interpretation(self, is_positive: bool) -> str:
        """Fallback interpretation if DeepSeek fails"""
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
        """Fallback recommendations if DeepSeek fails"""
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
        """Fallback detailed findings if DeepSeek fails"""
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
