import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HistoryService, AnalysisHistory } from '../../services/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  analyses: AnalysisHistory[] = [];
  currentUser: any = null;
  isLoading = true;

  constructor(
    public authService: AuthService,
    private historyService: HistoryService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadHistory(user.email);
      } else {
        this.analyses = [];
        this.isLoading = false;
        
      }
    });
  }

  private loadHistory(userId: string): void {
    this.historyService.history$.subscribe(allHistory => {
      this.analyses = this.historyService.getHistoryByUser(userId);
      this.isLoading = false;
    });
  }

  deleteAnalysis(id: string): void {
    if (this.currentUser && confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
      this.historyService.deleteAnalysis(id, this.currentUser.email);
    }
  }

  clearAll(): void {
    if (this.currentUser && confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) {
      this.historyService.clearUserHistory(this.currentUser.email);
    }
  }

  getConfidencePercentage(confidence: number): number {
    return parseFloat((confidence * 100).toFixed(1));
  }

  isPositive(label: string): boolean {
    return label.toLowerCase().includes('positif') || label.toLowerCase().includes('cancer');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileSize(fileName: string): string {
    // Estimation basée sur le nom du fichier si disponible
    return fileName;
  }

  navigateToAnalyse(): void {
    // Cette méthode sera gérée par le Dashboard parent
    // Pour l'instant, on ne fait rien car la navigation est gérée par le Dashboard
  }

  downloadReport(analysis: AnalysisHistory): void {
    if (!analysis.reportPdf) {
      alert('Le rapport n\'a pas encore été généré pour cette analyse.');
      return;
    }

    // Créer un lien de téléchargement depuis le base64
    const link = document.createElement('a');
    link.href = analysis.reportPdf;
    link.download = `Rapport_Medical_${analysis.patientId}_${new Date(analysis.date).toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

