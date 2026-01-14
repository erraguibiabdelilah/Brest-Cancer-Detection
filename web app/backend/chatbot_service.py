"""
Service de chatbot médical utilisant Azure AI Inference API
Spécialisé dans la détection du cancer du sein
"""

import os
import json
import unicodedata
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import requests

# Charger les variables d'environnement
load_dotenv()

# Base de connaissances locale (FAQ) pour le chatbot
LOCAL_FAQ = {
    # Questions sur un résultat positif
    "resultat positif": "Un résultat positif ne signifie pas automatiquement que vous avez un cancer. Il indique que des anomalies ont été détectées. Veuillez consulter un médecin pour confirmer et discuter des prochaines étapes.",
    "que faire si mon résultat est positif": "Un résultat positif ne signifie pas automatiquement que vous avez un cancer. Il indique que des anomalies ont été détectées. Veuillez consulter un médecin pour confirmer et discuter des prochaines étapes.",
    "dois-je consulter un médecin immédiatement": "Un résultat positif ne signifie pas automatiquement que vous avez un cancer. Il indique que des anomalies ont été détectées. Veuillez consulter un médecin pour confirmer et discuter des prochaines étapes.",
    "un résultat positif signifie-t-il que j'ai un cancer": "Un résultat positif ne signifie pas automatiquement que vous avez un cancer. Il indique que des anomalies ont été détectées. Veuillez consulter un médecin pour confirmer et discuter des prochaines étapes.",
    "puis-je refaire le test pour confirmer": "Un résultat positif ne signifie pas automatiquement que vous avez un cancer. Il indique que des anomalies ont été détectées. Veuillez consulter un médecin pour confirmer et discuter des prochaines étapes.",
    
    # Questions sur un résultat négatif
    "resultat négatif": "Un résultat négatif signifie qu'aucune anomalie n'a été détectée. Cependant, cela ne remplace pas le suivi médical régulier et le dépistage recommandé par un médecin.",
    "un résultat négatif signifie-t-il que je suis en sécurité": "Un résultat négatif signifie qu'aucune anomalie n'a été détectée. Cependant, cela ne remplace pas le suivi médical régulier et le dépistage recommandé par un médecin.",
    "puis-je faire confiance au résultat négatif": "Un résultat négatif signifie qu'aucune anomalie n'a été détectée. Cependant, cela ne remplace pas le suivi médical régulier et le dépistage recommandé par un médecin.",
    "dois-je refaire le test régulièrement": "Un résultat négatif signifie qu'aucune anomalie n'a été détectée. Cependant, cela ne remplace pas le suivi médical régulier et le dépistage recommandé par un médecin.",
    
    # Questions sur la sécurité des données
    "mes données sont-elles sécurisées": "L'analyse est rapide et confidentielle. Vos résultats sont visibles uniquement par vous et ne sont pas partagés sans votre consentement.",
    "sécurité des données": "L'analyse est rapide et confidentielle. Vos résultats sont visibles uniquement par vous et ne sont pas partagés sans votre consentement.",
    "confidentialité": "L'analyse est rapide et confidentielle. Vos résultats sont visibles uniquement par vous et ne sont pas partagés sans votre consentement.",
    "données confidentielles": "L'analyse est rapide et confidentielle. Vos résultats sont visibles uniquement par vous et ne sont pas partagés sans votre consentement.",
}

# Prompt système pour le chatbot médical
SYSTEM_PROMPT = """Tu es un assistant médical intelligent spécialisé dans la détection du cancer du sein. 
Tu dois fournir des réponses rapides, précises et empathiques. 
Tu peux aider avec :
- Des informations sur la détection du cancer du sein
- L'interprétation des résultats
- Des conseils généraux de santé
- Répondre aux questions des patients

Reste professionnel, bienveillant et concis dans tes réponses.
Important : Tu ne dois jamais poser de diagnostic définitif. Rappelle toujours que seul un médecin peut établir un diagnostic médical."""


def check_local_faq(user_message: str) -> Optional[str]:
    """
    Vérifie si la question de l'utilisateur correspond à une FAQ locale.
    
    Args:
        user_message: Le message de l'utilisateur
        
    Returns:
        La réponse de la FAQ si trouvée, None sinon
    """
    # Normaliser le message (minuscules, supprimer accents et caractères spéciaux)
    message_lower = user_message.lower().strip()
    
    # Supprimer les accents et caractères spéciaux pour une meilleure correspondance
    message_normalized = ''.join(
        c for c in unicodedata.normalize('NFD', message_lower)
        if unicodedata.category(c) != 'Mn'
    )
    
    # Vérifier chaque clé de la FAQ
    for key, answer in LOCAL_FAQ.items():
        key_normalized = ''.join(
            c for c in unicodedata.normalize('NFD', key)
            if unicodedata.category(c) != 'Mn'
        )
        # Vérifier si la clé est contenue dans le message
        if key_normalized in message_normalized or message_normalized in key_normalized:
            return answer
    
    return None


def generate_chatbot_response(
    user_message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    temperature: float = 0.9,
    max_tokens: int = 800
) -> str:
    """
    Génère une réponse du chatbot à partir d'un message utilisateur en utilisant Azure AI Inference API
    
    Args:
        user_message: Le message de l'utilisateur
        conversation_history: Historique de conversation (liste de dict avec 'role' et 'content')
        temperature: Température pour la génération (0.0-1.0)
        max_tokens: Nombre maximum de tokens dans la réponse
        
    Returns:
        La réponse du chatbot
        
    Raises:
        ValueError: Si la clé API ou l'endpoint ne sont pas configurés ou en cas d'erreur
    """
    # Vérifier d'abord si la question correspond à une FAQ locale
    local_answer = check_local_faq(user_message)
    if local_answer:
        print(f"✅ [ChatbotService] Réponse trouvée dans la FAQ locale")
        return local_answer
    
    # Récupérer la configuration Azure depuis les variables d'environnement
    # Support pour GitHub Models (format Bearer) et Azure OpenAI (format api-key)
    azure_api_key = os.getenv("AZURE_AI_INFERENCE_API_KEY") or os.getenv("GITHUB_TOKEN")
    azure_endpoint = os.getenv("AZURE_AI_INFERENCE_ENDPOINT", "https://models.github.ai/inference/chat/completions")
    azure_model = os.getenv("AZURE_AI_INFERENCE_MODEL", "openai/gpt-4.1-mini")
    
    if not azure_api_key or azure_api_key in ["votre_token_github_ici", "votre_cle_api_azure"]:
        raise ValueError(
            "GITHUB_TOKEN ou AZURE_AI_INFERENCE_API_KEY non configuré dans le fichier .env. "
            "Veuillez configurer votre token GitHub dans backend/.env. "
            "Obtenez votre token sur https://github.com/settings/tokens"
        )
    
    try:
        # Détecter le type d'endpoint et construire l'URL appropriée
        use_github_models = "github.ai" in azure_endpoint or "models.github.ai" in azure_endpoint
        
        if use_github_models:
            # Format GitHub Models: https://models.github.ai/inference/chat/completions
            if "/inference/chat/completions" not in azure_endpoint:
                api_url = "https://models.github.ai/inference/chat/completions"
            else:
                api_url = azure_endpoint
            auth_header = "Authorization"
            auth_value = f"Bearer {azure_api_key}"
        elif "openai.azure.com" in azure_endpoint or "inference.ai.azure.com" in azure_endpoint:
            # Format Azure OpenAI standard
            if "/openai/deployments" not in azure_endpoint:
                api_url = f"{azure_endpoint}/openai/deployments/{azure_model}/chat/completions?api-version=2024-02-15-preview"
            else:
                api_url = f"{azure_endpoint}?api-version=2024-02-15-preview"
            auth_header = "api-key"
            auth_value = azure_api_key
        else:
            # Format générique (supposé GitHub Models)
            if "/inference/chat/completions" not in azure_endpoint:
                api_url = f"{azure_endpoint}/inference/chat/completions"
            else:
                api_url = azure_endpoint
            auth_header = "Authorization"
            auth_value = f"Bearer {azure_api_key}"
        
        # Construire les messages pour l'API
        messages = []
        
        # Ajouter le message système
        messages.append({
            "role": "system",
            "content": SYSTEM_PROMPT
        })
        
        # Ajouter l'historique de conversation
        if conversation_history:
            for msg in conversation_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role != "system" and content:
                    # Azure/GitHub Models utilise "assistant"
                    if role == "assistant":
                        messages.append({"role": "assistant", "content": content})
                    elif role == "user":
                        messages.append({"role": "user", "content": content})
        
        # Ajouter le message actuel de l'utilisateur
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Préparer les headers
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            auth_header: auth_value
        }
        
        # Préparer le body de la requête
        body = {
            "messages": messages,
            "model": azure_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 1.0
        }
        
        print(f"📤 [ChatbotService] Appel Azure AI Inference: {api_url}")
        print(f"📤 [ChatbotService] Modèle: {azure_model}")
        print(f"📤 [ChatbotService] Type: {'GitHub Models' if use_github_models else 'Azure OpenAI'}")
        
        # Faire l'appel API
        response = requests.post(
            api_url,
            headers=headers,
            json=body,
            timeout=30
        )
        
        # Vérifier le statut de la réponse
        response.raise_for_status()
        
        # Parser la réponse
        response_data = response.json()
        
        # Extraire la réponse du chatbot
        if "choices" in response_data and len(response_data["choices"]) > 0:
            assistant_message = response_data["choices"][0]["message"]["content"]
            print(f"✅ [ChatbotService] Réponse reçue d'Azure AI Inference")
            return assistant_message.strip()
        else:
            raise ValueError("Réponse Azure AI invalide: aucune choice trouvée")
            
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        print(f"⚠️ Erreur de requête Azure AI Inference: {error_msg}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"⚠️ Détails de l'erreur: {error_detail}")
                error_msg = error_detail.get("error", {}).get("message", error_msg)
            except:
                error_msg = f"{error_msg} (Status: {e.response.status_code})"
        raise ValueError(f"Erreur lors de la génération de la réponse: {error_msg}")
    except Exception as e:
        error_msg = str(e)
        print(f"⚠️ Erreur avec Azure AI Inference API: {error_msg}")
        raise ValueError(f"Erreur lors de la génération de la réponse: {error_msg}")

