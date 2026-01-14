import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ChatbotLocalService } from './chatbot-local.service';

// Interfaces pour le chatbot
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatbotAPIRequest {
  message: string;
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatbotAPIResponse {
  response: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  // Configuration de l'API backend
  private readonly API_URL = 'http://localhost:8000';
  private readonly CHATBOT_ENDPOINT = `${this.API_URL}/chatbot`;
  
  private useLocalFallback = true; // Utiliser le mode local (statique) par défaut

  // Historique de conversation (en mémoire)
  private conversationHistory: ChatMessage[] = [];
  
  // Subject pour diffuser les réponses
  private messageSubject = new Subject<ChatMessage>();
  public messages$ = this.messageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private localService: ChatbotLocalService,
    private ngZone: NgZone
  ) {
    // Message système pour définir le comportement du chatbot
    this.conversationHistory.push({
      role: 'system',
      content: `Tu es un assistant médical intelligent spécialisé dans la détection du cancer du sein. 
      Tu dois fournir des réponses rapides, précises et empathiques. 
      Tu peux aider avec :
      - Des informations sur la détection du cancer du sein
      - L'interprétation des résultats
      - Des conseils généraux de santé
      - Répondre aux questions des patients
      
      Reste professionnel, bienveillant et concis dans tes réponses.`
    });
  }

  /**
   * Envoie un message au chatbot et reçoit une réponse
   */
  sendMessage(userMessage: string): Observable<string> {
    return new Observable(observer => {
      // Ajouter le message de l'utilisateur à l'historique
      const userMsg: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      
      this.conversationHistory.push(userMsg);
      this.messageSubject.next(userMsg);

      // Utiliser le système local si activé
      if (this.useLocalFallback) {
        this.processLocalResponse(userMessage, observer);
        return;
      }

      // Appel à l'API backend
      this.callBackendAPI(observer, userMessage);
    });
  }

  /**
   * Appel à l'API backend pour obtenir une réponse du chatbot
   */
  private callBackendAPI(observer: any, userMessage: string): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Préparer l'historique de conversation (sans le message système et sans le dernier message utilisateur qui est déjà dans le champ 'message')
    const conversationHistory = this.conversationHistory
      .filter(msg => msg.role !== 'system')
      .slice(0, -1) // Exclure le dernier message (celui qu'on vient d'ajouter)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const body: ChatbotAPIRequest = {
      message: userMessage,
      conversation_history: conversationHistory,
      temperature: 0.9,
      max_tokens: 800
    };

    console.log('📤 [ChatbotService] Envoi de la requête à:', this.CHATBOT_ENDPOINT);
    console.log('📤 [ChatbotService] Corps de la requête:', JSON.stringify(body, null, 2));
    console.log('📤 [ChatbotService] Headers:', headers.keys());

    this.http.post<ChatbotAPIResponse>(this.CHATBOT_ENDPOINT, body, { headers })
      .subscribe({
        next: (response) => {
          this.handleBackendSuccess(response, observer);
        },
        error: (error) => {
          this.handleBackendError(error, userMessage, observer);
        }
      });
  }

  /**
   * Traite une réponse réussie de l'API backend
   */
  private handleBackendSuccess(response: ChatbotAPIResponse, observer: any): void {
    console.log('✅ [ChatbotService] Réponse reçue du backend:', response);
    
    if (response.success && response.response) {
      const assistantMessage = response.response;
      
      console.log('✅ [ChatbotService] Réponse du chatbot (dynamique):', assistantMessage.substring(0, 100) + '...');
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };
      
      this.conversationHistory.push(assistantMsg);
      this.messageSubject.next(assistantMsg);
      
      observer.next(assistantMessage);
      observer.complete();
    } else {
      console.error('❌ [ChatbotService] Réponse backend invalide:', response);
      observer.error('Aucune réponse reçue du chatbot');
    }
  }

  /**
   * Gère les erreurs de l'API backend
   */
  private handleBackendError(error: any, userMessage: string, observer: any): void {
    console.error('❌ [ChatbotService] Erreur API backend:', error);
    console.error('❌ [ChatbotService] URL:', this.CHATBOT_ENDPOINT);
    console.error('❌ [ChatbotService] Status:', error.status);
    console.error('❌ [ChatbotService] Status Text:', error.statusText);
    
    // Afficher plus de détails sur l'erreur
    if (error.error) {
      console.error('❌ [ChatbotService] Détails de l\'erreur:', error.error);
    }
    
    // Vérifier si c'est une erreur de connexion (backend non démarré)
    if (error.status === 0 || error.status === undefined) {
      console.error('❌ [ChatbotService] Le backend ne semble pas être démarré ou inaccessible');
      observer.error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8000');
      return;
    }
    
    // Basculer vers le mode local uniquement pour certaines erreurs
    // Ne pas utiliser le fallback pour les erreurs de connexion
    if (error.status >= 500 || (error.status >= 400 && error.status !== 404)) {
      console.warn('⚠️ [ChatbotService] Basculement vers le mode local (fallback)');
      this.processLocalResponse(userMessage, observer);
    } else {
      observer.error(`Erreur lors de la communication avec le serveur: ${error.statusText || 'Erreur inconnue'}`);
    }
  }

  /**
   * Traite une réponse avec le service local (fallback)
   */
  private processLocalResponse(userMessage: string, observer: any): void {
    console.warn('⚠️ [ChatbotService] Utilisation du service local (statique) comme fallback');
    
    this.ngZone.run(() => {
      setTimeout(() => {
        try {
          const assistantMessage = this.localService.generateResponse(userMessage);
          
          // Vérifier que la réponse n'est pas undefined ou vide
          if (!assistantMessage || typeof assistantMessage !== 'string') {
            console.error('❌ [ChatbotService] Réponse locale invalide:', assistantMessage);
            observer.error('Impossible de générer une réponse. Veuillez réessayer.');
            return;
          }
          
          const preview = assistantMessage.length > 100 ? assistantMessage.substring(0, 100) + '...' : assistantMessage;
          console.log('📝 [ChatbotService] Réponse locale générée:', preview);
          
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date()
          };
          
          this.conversationHistory.push(assistantMsg);
          this.messageSubject.next(assistantMsg);
          
          observer.next(assistantMessage);
          observer.complete();
        } catch (error) {
          console.error('❌ [ChatbotService] Erreur dans processLocalResponse:', error);
          observer.error('Erreur lors de la génération de la réponse locale.');
        }
      }, 500);
    });
  }

  /**
   * Réinitialise la conversation (garde uniquement le message système)
   */
  clearConversation(): void {
    const systemMessage = this.conversationHistory[0];
    this.conversationHistory = [systemMessage];
  }

  /**
   * Retourne l'historique de conversation actuel
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory].filter(msg => msg.role !== 'system');
  }

  /**
   * Configuration personnalisée du comportement du chatbot
   */
  setSystemPrompt(prompt: string): void {
    this.conversationHistory[0] = {
      role: 'system',
      content: prompt
    };
  }

  /**
   * Active ou désactive le mode local
   */
  setLocalFallback(enabled: boolean): void {
    this.useLocalFallback = enabled;
  }

  /**
   * Vérifie si l'API backend est disponible
   */
  isAPIConfigured(): boolean {
    // L'API backend est toujours considérée comme configurée
    // Le fallback local sera utilisé en cas d'erreur
    return true;
  }
}
