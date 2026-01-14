import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UploadComponent } from '../upload/upload.component';
import { HistoryComponent } from '../history/history.component';
import { ProfileComponent } from '../profile/profile';
import { AuthService } from '../../services/auth.service';
import { HistoryService, AnalysisHistory } from '../../services/history.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UploadComponent, HistoryComponent, ProfileComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  activePage: string = 'dashboard';
  hoveredItem: string | null = null;
  currentUser: any = null;
  analyses: AnalysisHistory[] = [];
  showProfileDropdown: boolean = false;
  showMobileMenu: boolean = false;
  
  navItems = [
    { id: 'dashboard', icon: 'icons/dash.png', label: 'Dashboard' },
    { id: 'historique', icon: 'icons/hist.png', label: 'Historique' },
    { id: 'analyse', icon: 'icons/analyse.png', label: 'Analyse' },
    { id: 'profile', icon: 'icons/profile.png', label: 'Profile' }
  ];

  constructor(
    private authService: AuthService,
    private historyService: HistoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardData(user.email);
      }
    });
  }

  private loadDashboardData(userId: string): void {
    // Charger les données initiales
    const userAnalyses = this.historyService.getHistoryByUser(userId);
    this.analyses = userAnalyses.slice(0, 5);
    
    // S'abonner aux changements pour mettre à jour automatiquement
    this.historyService.history$.subscribe(allHistory => {
      const updatedAnalyses = this.historyService.getHistoryByUser(userId);
      this.analyses = updatedAnalyses.slice(0, 5); // Pour la table, on garde seulement les 5 premières
    });
  }

  setActivePage(pageId: string): void {
    this.activePage = pageId;
  }

  setHoveredItem(itemId: string | null): void {
    this.hoveredItem = itemId;
  }

  private getAllUserAnalyses(): AnalysisHistory[] {
    if (!this.currentUser) return [];
    return this.historyService.getHistoryByUser(this.currentUser.email);
  }

  getTotalAnalyses(): number {
    return this.getAllUserAnalyses().length;
  }

  getPositiveCount(): number {
    return this.getAllUserAnalyses().filter(a => 
      a.result.label.toLowerCase().includes('positif') || 
      a.result.label.toLowerCase().includes('cancer')
    ).length;
  }

  getAverageConfidence(): number {
    const allAnalyses = this.getAllUserAnalyses();
    if (allAnalyses.length === 0) return 0;
    const sum = allAnalyses.reduce((acc, a) => {
      const conf = a.result.confidence > 1 ? a.result.confidence : a.result.confidence * 100;
      return acc + conf;
    }, 0);
    return Math.round(sum / allAnalyses.length);
  }

  getDetectionRate(): number {
    const allAnalyses = this.getAllUserAnalyses();
    if (allAnalyses.length === 0) return 0;
    return Math.round((this.getPositiveCount() / allAnalyses.length) * 100);
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

  onNavItemClick(pageId: string): void {
    this.setActivePage(pageId);
    this.closeMobileMenu();
  }
}
