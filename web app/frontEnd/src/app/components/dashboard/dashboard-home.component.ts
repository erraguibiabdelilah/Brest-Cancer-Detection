import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HistoryService, AnalysisHistory } from '../../services/history.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-view">
      <div class="content-wrapper">
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">{{ getDetectionRate() }}%</div>
            <div class="kpi-label">Taux de détection</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">{{ getTotalAnalyses() }}</div>
            <div class="kpi-label">Éléments analysés</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">{{ getAverageConfidence() }}%</div>
            <div class="kpi-label">Précision IA</div>
          </div>
        </div>

        <!-- Recent Analyses Table -->
        <div class="table-container">
          <div class="table-header">
            <h2>Analyses récentes</h2>
          </div>
          
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID Patient</th>
                  <th>Nom du fichier</th>
                  <th>Résultat</th>
                  <th>Confiance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let analysis of analyses; let i = index" class="table-row">
                  <td>{{ i + 1 }}</td>
                  <td>{{ analysis.patientId }}</td>
                  <td>{{ analysis.fileName }}</td>
                  <td>
                    <span [class.positive]="analysis.result.confidence >= 0.5"
                          [class.negative]="analysis.result.confidence < 0.5"
                          class="result-badge">
                      {{ analysis.result.confidence >= 0.5 ? 'POSITIF' : 'NÉGATIF' }}
                    </span>
                  </td>
                  <td>{{ (analysis.result.confidence > 1 ? analysis.result.confidence : analysis.result.confidence * 100) | number:'1.0-0' }}%</td>
                  <td>{{ analysis.date | date:'dd/MM/yyyy' }}</td>
                </tr>
                <tr *ngIf="analyses.length === 0">
                  <td colspan="6" class="empty-message">Aucune analyse disponible</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-view {
      padding: 32px;
      height: 100%;
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .kpi-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .kpi-value {
      font-size: 36px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .kpi-label {
      font-size: 14px;
      color: #6b7280;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .table-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background-color: #06024b;
      color: white;
    }

    .data-table th {
      padding: 12px 24px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
    }

    .data-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
      transition: background-color 0.2s;
    }

    .data-table tbody tr:hover {
      background-color: #f9fafb;
    }

    .data-table td {
      padding: 16px 24px;
      font-size: 14px;
      color: #374151;
    }

    .result-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .result-badge.positive {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .result-badge.negative {
      background-color: #d1fae5;
      color: #059669;
    }

    .empty-message {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .dashboard-view {
        padding: 16px;
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  currentUser: any = null;
  analyses: AnalysisHistory[] = [];

  constructor(
    private authService: AuthService,
    private historyService: HistoryService
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
    const userAnalyses = this.historyService.getHistoryByUser(userId);
    this.analyses = userAnalyses.slice(0, 5);
    
    this.historyService.history$.subscribe(allHistory => {
      const updatedAnalyses = this.historyService.getHistoryByUser(userId);
      this.analyses = updatedAnalyses.slice(0, 5);
    });
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
}

