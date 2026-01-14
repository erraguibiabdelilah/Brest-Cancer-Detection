import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  @Output() close = new EventEmitter<void>();
  
  isLoginMode = true; // true = login, false = signup
  email = '';
  password = '';
  name = '';
  confirmPassword = '';
  error = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = '';
    this.successMessage = '';
    this.email = '';
    this.password = '';
    this.name = '';
    this.confirmPassword = '';
  }

  async onSubmit() {
    this.error = '';
    this.successMessage = '';
    this.isLoading = true;

    // Validation
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      this.isLoading = false;
      return;
    }

    if (!this.isLoginMode) {
      // Mode signup
      if (!this.name) {
        this.error = 'Veuillez entrer votre nom';
        this.isLoading = false;
        return;
      }
      
      if (this.password !== this.confirmPassword) {
        this.error = 'Les mots de passe ne correspondent pas';
        this.isLoading = false;
        return;
      }
      
      if (this.password.length < 6) {
        this.error = 'Le mot de passe doit contenir au moins 6 caractères';
        this.isLoading = false;
        return;
      }

      // Signup
      try {
        const result = await this.authService.signup(this.email, this.password, this.name);
        if (result.success) {
          // L'utilisateur est automatiquement connecté, rediriger vers le dashboard
          this.successMessage = 'Inscription réussie ! Redirection...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
            this.closeModal();
          }, 500);
        } else {
          this.error = result.error || 'Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.';
          // Si l'email est déjà utilisé, suggérer de se connecter
          if (result.error && (result.error.includes('déjà utilisé') || result.error.includes('already'))) {
            // L'erreur sera affichée avec un message suggérant de se connecter
          }
        }
      } catch (err: any) {
        console.error('Erreur d\'inscription:', err);
        this.error = err?.error?.detail || err?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
      }
    } else {
      // Mode login
      try {
        const result = await this.authService.login(this.email, this.password);
        if (result.success) {
          this.successMessage = 'Connexion réussie ! Redirection...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
            this.closeModal();
          }, 500);
        } else {
          this.error = result.error || 'Email ou mot de passe incorrect';
        }
      } catch (err: any) {
        console.error('Erreur de connexion:', err);
        this.error = err?.error?.detail || err?.message || 'Erreur lors de la connexion. Veuillez réessayer.';
      }
    }

    this.isLoading = false;
  }

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if ((event.target as HTMLElement).classList.contains('auth-modal-overlay')) {
      this.closeModal();
    }
  }
}

