"""
Configuration des prompts Gemini AI
Modifiez ces prompts pour personnaliser le style et le contenu des rapports
"""

# Langue du rapport (fr, en, es, etc.)
REPORT_LANGUAGE = "fr"

# Ton du rapport (professional, empathetic, technical)
REPORT_TONE = "professional"

# Niveau de détail (basic, detailed, comprehensive)
DETAIL_LEVEL = "detailed"

# Prompts personnalisables
INTERPRETATION_PROMPT_TEMPLATE = """
Tu es un médecin spécialiste en oncologie et radiologie. Génère une interprétation clinique professionnelle pour un rapport médical.

Contexte:
- Type d'examen: Analyse histopathologique pour détection de cancer du sein (IDC)
- Résultat: {result_type}
- Score de confiance: {confidence}%
- Langue: {language}
- Ton: {tone}

Instructions:
1. Rédige une interprétation clinique professionnelle et médicale
2. Utilise un ton {tone} mais factuel
3. Mentionne les caractéristiques observées par l'IA
4. Longueur: 3-4 phrases (environ 150-200 mots)
5. Ne mentionne PAS de noms de patients ou de dates
6. Reste objectif et scientifique

Génère uniquement le texte de l'interprétation, sans titre ni introduction.
"""

RECOMMENDATIONS_PROMPT_TEMPLATE = """
Tu es un médecin spécialiste. Génère une liste de recommandations médicales pour un rapport.

Contexte:
- Résultat: {result_type}
- Score de confiance: {confidence}%
- Langue: {language}
- Ton: {tone}

Instructions:
1. Génère exactement 5 recommandations médicales
2. Chaque recommandation doit être courte et actionnable
3. Pour cas POSITIF: recommandations urgentes (commencer par ⚠)
4. Pour cas NÉGATIF: recommandations de suivi préventif (commencer par ✓)
5. Utilise un ton {tone} et médical
6. Format: une recommandation par ligne

Génère uniquement la liste des recommandations, une par ligne.
"""

FINDINGS_PROMPT_TEMPLATE = """
Tu es un médecin pathologiste. Génère une description détaillée des observations pour un rapport médical.

Contexte:
- Type d'analyse: Histopathologie - Détection IDC (Carcinome canalaire invasif)
- Résultat: {result_type}
- Confiance: {confidence}%
- Langue: {language}
- Niveau de détail: {detail_level}

Instructions:
1. Décris les observations microscopiques et tissulaires
2. Mentionne les patterns identifiés par l'IA
3. Utilise un vocabulaire médical précis
4. Longueur: 4-5 phrases (environ 200 mots)
5. Reste factuel et scientifique

Génère uniquement la description détaillée.
"""

def get_interpretation_prompt(is_positive: bool, confidence: float) -> str:
    """Génère le prompt pour l'interprétation"""
    result_type = "POSITIF - Cancer détecté" if is_positive else "NÉGATIF - Pas de cancer"
    return INTERPRETATION_PROMPT_TEMPLATE.format(
        result_type=result_type,
        confidence=confidence * 100,
        language=REPORT_LANGUAGE,
        tone=REPORT_TONE
    )

def get_recommendations_prompt(is_positive: bool, confidence: float) -> str:
    """Génère le prompt pour les recommandations"""
    result_type = "POSITIF - Cancer détecté" if is_positive else "NÉGATIF - Pas de cancer"
    return RECOMMENDATIONS_PROMPT_TEMPLATE.format(
        result_type=result_type,
        confidence=confidence * 100,
        language=REPORT_LANGUAGE,
        tone=REPORT_TONE
    )

def get_findings_prompt(is_positive: bool, confidence: float) -> str:
    """Génère le prompt pour les observations détaillées"""
    result_type = "POSITIF" if is_positive else "NÉGATIF"
    return FINDINGS_PROMPT_TEMPLATE.format(
        result_type=result_type,
        confidence=confidence * 100,
        language=REPORT_LANGUAGE,
        detail_level=DETAIL_LEVEL
    )
