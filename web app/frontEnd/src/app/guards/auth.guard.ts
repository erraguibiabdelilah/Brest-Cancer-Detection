import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Vérifier d'abord si un token existe dans localStorage
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    
    if (!token || !userStr) {
      // Pas de token, rediriger vers la landing page
      this.router.navigate(['/']);
      return false;
    }

    // Si l'utilisateur est déjà authentifié (vérification rapide)
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Sinon, attendre que l'authentification soit vérifiée
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          // Si après vérification l'utilisateur n'est pas authentifié, rediriger
          this.router.navigate(['/']);
          return false;
        }
      }),
      catchError(() => {
        // En cas d'erreur, rediriger vers la landing page
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}

