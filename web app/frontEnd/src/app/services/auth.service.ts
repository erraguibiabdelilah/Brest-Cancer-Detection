import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  name?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Vérifier si l'utilisateur est déjà authentifié (localStorage)
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Vérifier si le token est toujours valide en appelant l'API
        this.verifyToken(token).subscribe({
          next: (userData) => {
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(userData);
          },
          error: () => {
            // Token invalide, déconnecter l'utilisateur
            this.logout();
          }
        });
      } catch (e) {
        this.logout();
      }
    }
  }

  private verifyToken(token: string): Observable<User> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<User>(`${this.apiUrl}/me`, { headers }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
        .pipe(
          catchError(error => {
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response) => {
            // Stocker le token et les informations utilisateur
            localStorage.setItem('authToken', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(response.user);
            
            resolve({ success: true });
          },
          error: (error) => {
            console.error('Erreur de connexion:', error);
            let errorMessage = 'Email ou mot de passe incorrect';
            
            if (error.status === 0) {
              errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur http://localhost:8000';
            } else if (error.status === 401) {
              errorMessage = error?.error?.detail || 'Email ou mot de passe incorrect';
            } else if (error.status >= 500) {
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            } else if (error?.error?.detail) {
              errorMessage = error.error.detail;
            }
            
            resolve({ success: false, error: errorMessage });
          }
        });
    });
  }

  signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { email, password, name })
        .pipe(
          catchError(error => {
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response) => {
            // Stocker le token et les informations utilisateur
            // L'utilisateur est automatiquement connecté après l'inscription
            localStorage.setItem('authToken', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(response.user);
            
            resolve({ success: true });
          },
          error: (error) => {
            console.error('Erreur d\'inscription:', error);
            let errorMessage = 'Erreur lors de l\'inscription';
            
            if (error.status === 0) {
              errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur http://localhost:8000';
            } else if (error.status === 400) {
              errorMessage = error?.error?.detail || 'Cet email est déjà utilisé';
            } else if (error.status >= 500) {
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            } else if (error?.error?.detail) {
              errorMessage = error.error.detail;
            }
            
            resolve({ success: false, error: errorMessage });
          }
        });
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }
}

