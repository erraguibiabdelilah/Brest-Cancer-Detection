import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private githubToken: string = '';
  private configLoaded: boolean = false;

  constructor(private http: HttpClient) {
    // Essayer de charger depuis environment.ts d'abord
    this.githubToken = environment.githubToken || '';
  }

  /**
   * Charge la configuration depuis un fichier config.json (optionnel)
   * Si le fichier n'existe pas, utilise la configuration par défaut
   */
  async loadConfig(): Promise<void> {
    if (this.configLoaded) {
      return;
    }

    try {
      // Essayer de charger depuis config.json
      const config = await firstValueFrom(this.http.get<{githubToken?: string}>('/assets/config.json'));
      if (config.githubToken) {
        this.githubToken = config.githubToken;
      }
    } catch (error) {
      // Le fichier config.json n'existe pas, utiliser la configuration par défaut
      console.log('📝 Configuration: Utilisation de la configuration par défaut (environment.ts ou .env)');
    }

    this.configLoaded = true;
  }

  /**
   * Retourne le token GitHub
   * Priorité: config.json > environment.ts > ''
   */
  getGithubToken(): string {
    // Si le token est défini dans environment.ts, l'utiliser
    if (environment.githubToken) {
      return environment.githubToken;
    }
    
    // Sinon, utiliser le token chargé depuis config.json
    return this.githubToken;
  }

  /**
   * Vérifie si le token GitHub est configuré
   */
  isGithubTokenConfigured(): boolean {
    const token = this.getGithubToken();
    return token !== '' && token !== undefined && token !== null;
  }
}

