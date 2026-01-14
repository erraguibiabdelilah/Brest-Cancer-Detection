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

export interface AzureAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AzureAIError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// ============================================
// VARIABLE GLOBALE - CONFIGUREZ VOTRE TOKEN ICI
// ============================================
export const GITHUB_TOKEN = 'VOTRE_GITHUB_TOKEN_ICI';
// ============================================

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  // Configuration Azure AI Inference via GitHub Models
  private readonly ENDPOINT = 'https://models.github.ai/inference/chat/completions';
  private readonly MODEL = 'openai/gpt-4.1-mini';
  
  private useLocalFallback = false; // Mettre à true si vous voulez utiliser le mode local par défaut

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

      // Vérifier que le token est configuré
      if (!GITHUB_TOKEN || GITHUB_TOKEN === 'VOTRE_GITHUB_TOKEN_ICI') {
        console.warn('Token GitHub non configuré, utilisation du mode local');
        this.processLocalResponse(userMessage, observer);
        return;
      }

      // Appel à l'API Azure AI Inference
      this.callAzureAI(observer, userMessage);
    });
  }

  /**
   * Appel à l'API Azure AI Inference via GitHub Models
   */
  private callAzureAI(observer: any, userMessage: string): void {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const body = {
      messages: this.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: this.MODEL,
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 800
    };

    this.http.post<AzureAIResponse>(this.ENDPOINT, body, { headers })
      .subscribe({
        next: (response) => {
          this.handleAzureAISuccess(response, observer);
        },
        error: (error) => {
          this.handleAzureAIError(error, userMessage, observer);
        }
      });
  }

  /**
   * Traite une réponse réussie de l'API Azure AI
   */
  private handleAzureAISuccess(response: AzureAIResponse, observer: any): void {
    if (response.choices && response.choices.length > 0) {
      const assistantMessage = response.choices[0].message.content;
      
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
      console.error('Réponse Azure AI invalide:', response);
      observer.error('Aucune réponse reçue du chatbot');
    }
  }

  /**
   * Gère les erreurs de l'API Azure AI
   */
  private handleAzureAIError(error: any, userMessage: string, observer: any): void {
    console.error('Erreur API Azure AI:', error);
    
    // Afficher plus de détails sur l'erreur
    if (error.error) {
      console.error('Détails de l\'erreur:', error.error);
    }
    
    // Basculer vers le mode local en cas d'erreur
    console.warn('Basculement vers le mode local');
    this.processLocalResponse(userMessage, observer);
  }

  /**
   * Traite une réponse avec le service local
   */
  private processLocalResponse(userMessage: string, observer: any): void {
    this.ngZone.run(() => {
      setTimeout(() => {
        const assistantMessage = this.localService.generateResponse(userMessage);
        
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date()
        };
        
        this.conversationHistory.push(assistantMsg);
        this.messageSubject.next(assistantMsg);
        
        observer.next(assistantMessage);
        observer.complete();
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
   * Vérifie si l'API est configurée correctement
   */
  isAPIConfigured(): boolean {
    return GITHUB_TOKEN !== 'VOTRE_GITHUB_TOKEN_ICI' && 
           GITHUB_TOKEN !== '';
  }
}