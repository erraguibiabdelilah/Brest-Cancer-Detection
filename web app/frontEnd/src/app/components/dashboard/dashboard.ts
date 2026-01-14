import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  hoveredItem: string | null = null;
  currentUser: any = null;
  showProfileDropdown: boolean = false;
  showMobileMenu: boolean = false;
  activeRoute: string = 'home';
  
  navItems = [
    { id: 'home', route: '/dashboard/home', icon: 'icons/dash.png', label: 'Dashboard' },
    { id: 'historique', route: '/dashboard/historique', icon: 'icons/hist.png', label: 'Historique' },
    { id: 'analyse', route: '/dashboard/analyse', icon: 'icons/analyse.png', label: 'Analyse' },
    { id: 'profile', route: '/dashboard/profile', icon: 'icons/profile.png', label: 'Profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Écouter les changements de route pour mettre à jour activeRoute
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      if (url.startsWith('/dashboard')) {
        const segments = url.split('/');
        this.activeRoute = segments[segments.length - 1] || 'home';
      }
    });

    // Initialiser activeRoute avec la route actuelle
    const url = this.router.url;
    if (url.startsWith('/dashboard')) {
      const segments = url.split('/');
      this.activeRoute = segments[segments.length - 1] || 'home';
    }
  }

  setHoveredItem(itemId: string | null): void {
    this.hoveredItem = itemId;
  }

  isActiveRoute(routeId: string): boolean {
    return this.activeRoute === routeId;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeProfileDropdown(): void {
    this.showProfileDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-wrapper')) {
      this.closeProfileDropdown();
    }
  }

  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }

  getInitials(): string {
    if (!this.currentUser?.name) {
      return this.currentUser?.email?.charAt(0).toUpperCase() || 'U';
    }
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return this.currentUser.name.charAt(0).toUpperCase();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  onNavItemClick(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }
}
