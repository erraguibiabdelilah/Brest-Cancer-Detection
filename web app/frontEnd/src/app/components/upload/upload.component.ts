import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PredictionResult } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HistoryService } from '../../services/history.service';
import { ConfigService } from '../../services/config.service';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  progressPercent: number = 0;
  result: PredictionResult | null = null;
  error: string | null = null;
  maxFileSize = 10 * 1024 * 1024; // 10MB
  loadingMessage = 'Analyse en cours...';
  imageDimensions: string = '';
  processingTime: string = '< 2s';
  analysisStartTime: number = 0;
  patientId: string = '';
  modelVersion: string = 'ResNet50 v2.1';
  imageType: string = 'Histopathologie';
  currentUser: any = null;
  private progressInterval: any = null;
  private progressStartTime: number = 0;
  private readonly MIN_PROGRESS_MS = 2000; // minimum animation duration
  isGeneratingReport = false;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private historyService: HistoryService,
    private configService: ConfigService
  ) {
    this.generatePatientId();
  }

  async ngOnInit() {
    // Charger la configuration au démarrage
    await this.configService.loadConfig();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }


  private generatePatientId(): void {
    this.patientId = 'P' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file.size > this.maxFileSize) {
      this.error = `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum : ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB`;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.error = 'Veuillez sélectionner un fichier image';
      return;
    }

    this.selectedFile = file;
    this.result = null;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        this.imageDimensions = `${img.width} x ${img.height}px`;
        this.cdr.detectChanges();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          const TARGET_SIZE = 50;
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Erreur lors de la compression'));
              }
            },
            'image/jpeg',
            0.75
          );
        };
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    });
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner une image';
      return;
    }

    this.isUploading = true;
    this.error = null;
    this.result = null;
    this.loadingMessage = 'Analyse en cours...';
    this.analysisStartTime = Date.now();

    try {
      const compressedFile = await this.compressImage(this.selectedFile);
      // start progress simulator
      this.startProgress();
      
      this.apiService.predictImage(compressedFile).subscribe({
        next: (result) => {
          if (!result || !result.label || result.confidence === undefined) {
            this.error = 'Données invalides reçues du serveur';
            this.isUploading = false;
            return;
          }
          
          // finalize progress to ensure it lasts at least MIN_PROGRESS_MS
          this.finalizeProgressAndSetResult(result);
        },
        error: (err) => {
          console.error('Error:', err);
          this.stopProgress();
          this.isUploading = false;
          
          if (err.status === 0) {
            this.error = 'Impossible de se connecter à l\'API. Vérifiez que FastAPI fonctionne.';
          } else if (err.status === 404) {
            this.error = 'Endpoint non trouvé. Vérifiez que l\'API expose /predict';
          } else if (err.status >= 500) {
            this.error = 'Erreur serveur. Vérifiez les logs de l\'API.';
          } else {
            this.error = `Erreur d'analyse (${err.status}). Réessayez.`;
          }
        }
      });
    } catch (error: any) {
      this.stopProgress();
      this.error = `Erreur de compression: ${error.message}`;
    }
  }

  private startProgress(): void {
    this.progressPercent = 0;
    this.progressStartTime = Date.now();
    this.isUploading = true;
    this.loadingMessage = 'Analyse en cours... 0%';

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    this.progressInterval = window.setInterval(() => {
      // Slowly increase progress up to 95% while waiting for server
      if (this.progressPercent < 95) {
        const increment = Math.random() * 3 + 0.5; // 0.5 - 3.5
        this.progressPercent = Math.min(95, this.progressPercent + increment);
        this.loadingMessage = `Analyse en cours... ${Math.floor(this.progressPercent)}%`;
        this.cdr.detectChanges();
      }
    }, 120);
  }

  private finalizeProgressAndSetResult(result: PredictionResult): void {
    const elapsed = Date.now() - this.progressStartTime;
    const remaining = Math.max(0, this.MIN_PROGRESS_MS - elapsed);

    setTimeout(() => {
      // fill to 100%
      this.progressPercent = 100;
      this.loadingMessage = 'Finalisation 100%';
      this.cdr.detectChanges();

      setTimeout(() => {
        this.stopProgress();
        this.isUploading = false;
        const elapsedSec = ((Date.now() - this.analysisStartTime) / 1000).toFixed(1);
        this.processingTime = `${elapsedSec}s`;
        this.result = result;
        this.loadingMessage = 'Analyse terminée';
        this.saveAnalysisToHistory(result);
        this.cdr.detectChanges();
      }, 300);
    }, remaining);
  }

  private stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    // keep the last percentage until component hides; reset on reset()
  }

  /**
   * Génère un rapport médical en utilisant l'API GitHub Models (GPT-4.1)
   */
  async generateMedicalReport(): Promise<void> {
    console.log('📄 Début de la génération du rapport médical');
    
    if (!this.result) {
      this.error = 'Aucun résultat d\'analyse disponible';
      console.error('❌ Aucun résultat disponible');
      return;
    }

    this.isGeneratingReport = true;
    this.error = null;
    this.cdr.detectChanges();

    try {
      console.log('📊 Préparation des données pour l\'IA');
      // Préparer les données pour l'IA
      const isPositive = this.isPositive();
      const confidence = this.getConfidencePercentage();
      const currentDate = new Date();

      console.log('🤖 Appel à l\'API GitHub Models...');
      // Appel à l'API GitHub Models
      const reportContent = await this.generateReportWithAI(isPositive, confidence, currentDate);
      console.log('✅ Contenu généré par l\'IA:', reportContent);

      console.log('📄 Génération du PDF...');
      // Générer le PDF avec le contenu AI
      await this.createPDFFromAIContent(reportContent, isPositive, confidence, currentDate);
      console.log('✅ PDF généré avec succès');

      this.isGeneratingReport = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du rapport:', error);
      const errorMessage = error?.message || 'Erreur inconnue lors de la génération du rapport';
      this.error = `Erreur de génération: ${errorMessage}`;
      this.isGeneratingReport = false;
      this.cdr.detectChanges();
      
      // Afficher l'erreur dans une alerte pour plus de visibilité
      alert(`Erreur lors de la génération du rapport:\n\n${errorMessage}\n\nVérifiez la console pour plus de détails.`);
    }
  }

  /**
   * Appelle l'API GitHub Models pour générer le contenu du rapport
   */
  private async generateReportWithAI(
    isPositive: boolean, 
    confidence: number, 
    date: Date
  ): Promise<any> {
    // Charger la configuration si ce n'est pas déjà fait
    await this.configService.loadConfig();
    
    // Essayer d'abord depuis le ConfigService, puis depuis environment directement
    let token = this.configService.getGithubToken();
    if (!token || token === '' || token === 'votre_token_github_ici') {
      token = environment.githubToken || '';
    }
    
    console.log('🔑 Token GitHub configuré:', token ? 'Oui (longueur: ' + token.length + ')' : 'Non');
    console.log('🔑 Token (premiers 10 caractères):', token ? token.substring(0, 10) + '...' : 'vide');
    
    if (!token || token === '' || token === 'votre_token_github_ici') {
      const errorMsg = 'Token GitHub non configuré. Veuillez modifier le fichier frontEnd/src/environments/environment.ts et ajouter votre token GitHub dans la propriété githubToken. Exemple: githubToken: \'ghp_votre_token_ici\'';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }
    
    const endpoint = 'https://models.github.ai/inference/chat/completions';
    const model = 'openai/gpt-4.1-mini';
    
    console.log('📤 Appel API GitHub Models:', endpoint);
    console.log('🤖 Modèle:', model);

    const systemPrompt = `Tu es un assistant médical spécialisé dans la rédaction de rapports d'analyse d'images médicales pour la détection du cancer du sein. 
Tu dois générer un rapport médical professionnel, structuré et précis en français.`;

    const userPrompt = `Génère un rapport médical complet pour une analyse d'image histopathologique du cancer du sein avec les informations suivantes:

- **Résultat**: ${isPositive ? 'POSITIF - Tumeur maligne détectée' : 'NÉGATIF - Aucune anomalie détectée'}
- **Confiance du modèle**: ${confidence}%
- **Identifiant patient**: ${this.patientId}
- **Date d'analyse**: ${date.toLocaleDateString('fr-FR')}
- **Type d'examen**: ${this.imageType}
- **Modèle IA**: ${this.modelVersion}
- **Dimensions image**: ${this.imageDimensions}
- **Temps de traitement**: ${this.processingTime}

Structure le rapport avec les sections suivantes en JSON:
{
  "interpretation": "Interprétation clinique détaillée (3-4 phrases)",
  "findings": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2", "Recommandation 3", "Recommandation 4"],
  "technicalNotes": "Notes techniques sur l'analyse (2-3 phrases)",
  "urgencyLevel": "Élevé" ou "Modéré" ou "Faible",
  "followUp": "Plan de suivi recommandé (2-3 phrases)"
}

Sois précis, professionnel et adapte le contenu selon le résultat (positif ou négatif).`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          top_p: 1.0,
          model: model,
          max_tokens: 1500
        })
      });

      console.log('📥 Réponse API reçue, status:', response.status);

      if (!response.ok) {
        let errorMessage = `Erreur API (${response.status}): ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('❌ Détails de l\'erreur API:', errorData);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Réponse d\'erreur (texte):', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Données reçues de l\'API');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Format de réponse invalide:', data);
        throw new Error('Format de réponse invalide de l\'API');
      }
      
      const content = data.choices[0].message.content;
      console.log('📝 Contenu reçu (premiers 200 caractères):', content.substring(0, 200));

      // Parser le JSON retourné par l'IA
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON parsé avec succès');
          return parsedContent;
        }
        throw new Error('Aucun JSON trouvé dans la réponse');
      } catch (e) {
        console.error('❌ Erreur de parsing JSON:', e);
        console.error('📝 Contenu complet:', content);
        throw new Error('Impossible de parser la réponse de l\'IA. Réponse: ' + content.substring(0, 200));
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'appel API GitHub Models:', error);
      if (error.message) {
        throw error;
      }
      throw new Error('Erreur lors de l\'appel à l\'API GitHub Models: ' + (error.toString() || 'Erreur inconnue'));
    }
  }

  /**
   * Crée le PDF à partir du contenu généré par l'IA
   */
  private async createPDFFromAIContent(
    aiContent: any,
    isPositive: boolean,
    confidence: number,
    currentDate: Date
  ): Promise<void> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let pdfBase64: string = '';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    let yPos = margin;

    // Fonctions helpers
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += fontSize * 1.3;
      });
    };

    const addSpace = (space: number = 10) => { yPos += space; };

    const addLine = () => {
      doc.setDrawColor('#e0e0e0');
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;
    };

    const addSection = (title: string) => {
      addSpace(15);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin - 10, yPos - 12, pageWidth - margin * 2 + 20, 25, 'F');
      addText(title, 14, true, '#2c3e50');
      addLine();
    };

    // EN-TÊTE
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 80, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RAPPORT D\'ANALYSE MÉDICALE', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Détection du Cancer du Sein - IA Avancée', pageWidth / 2, 55, { align: 'center' });
    
    yPos = 100;

    // INFORMATIONS DU PATIENT
    addSection('INFORMATIONS DU PATIENT');
    
    const patientInfo = [
      ['Identifiant Patient', this.patientId],
      ['Date d\'analyse', currentDate.toLocaleDateString('fr-FR')],
      ['Heure', currentDate.toLocaleTimeString('fr-FR')],
      ['Type d\'examen', this.imageType]
    ];

    patientInfo.forEach(([label, value]) => {
      doc.setTextColor('#666666');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(label + ' :', margin, yPos);
      
      doc.setTextColor('#000000');
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 150, yPos);
      yPos += 20;
    });

    // RÉSULTAT DU DIAGNOSTIC
    addSection('RÉSULTAT DU DIAGNOSTIC');
    
    const resultColor = isPositive ? '#e74c3c' : '#27ae60';
    doc.setFillColor(resultColor);
    doc.rect(margin - 10, yPos - 10, pageWidth - margin * 2 + 20, 60, 'F');
    
    doc.setTextColor('#ffffff');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.result!.label, pageWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Confiance : ${confidence}%`, pageWidth / 2, yPos + 35, { align: 'center' });
    
    yPos += 80;

    // DÉTAILS DE L'ANALYSE
    addSection('DÉTAILS DE L\'ANALYSE');
    
    const analysisDetails = [
      ['Modèle IA', `CNN (${this.modelVersion})`],
      ['Dimensions image', this.imageDimensions],
      ['Nom du fichier', this.selectedFile?.name || 'N/A'],
      ['Temps de traitement', this.processingTime],
      ['Niveau d\'urgence', aiContent.urgencyLevel || 'N/A'],
      ['Classification', this.result!.label]
    ];

    analysisDetails.forEach(([label, value]) => {
      doc.setTextColor('#666666');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(label + ' :', margin, yPos);
      
      doc.setTextColor('#000000');
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 150, yPos);
      yPos += 18;
    });

    // INTERPRÉTATION CLINIQUE (Générée par IA)
    addSection('INTERPRÉTATION CLINIQUE');
    addText(aiContent.interpretation || 'Aucune interprétation disponible', 10, false, '#333333');

    // OBSERVATIONS DÉTAILLÉES (Générées par IA)
    if (aiContent.findings && aiContent.findings.length > 0) {
      addSection('OBSERVATIONS DÉTAILLÉES');
      aiContent.findings.forEach((finding: string, index: number) => {
        addText(`${index + 1}. ${finding}`, 10, false, '#333333');
        addSpace(5);
      });
    }

    // RECOMMANDATIONS (Générées par IA)
    addSection('RECOMMANDATIONS MÉDICALES');
    if (aiContent.recommendations && aiContent.recommendations.length > 0) {
      aiContent.recommendations.forEach((rec: string) => {
        addText(`${isPositive ? '⚠' : '✓'} ${rec}`, 10, false, isPositive ? '#c0392b' : '#27ae60');
        addSpace(3);
      });
    }

    // PLAN DE SUIVI (Généré par IA)
    if (aiContent.followUp) {
      addSection('PLAN DE SUIVI');
      addText(aiContent.followUp, 10, false, '#333333');
    }

    // NOTES TECHNIQUES (Générées par IA)
    if (aiContent.technicalNotes) {
      addSection('NOTES TECHNIQUES');
      addText(aiContent.technicalNotes, 9, false, '#666666');
    }

    // AVERTISSEMENT LÉGAL
    addSection('AVERTISSEMENT LÉGAL');
    
    doc.setFillColor(255, 243, 205);
    doc.rect(margin - 10, yPos - 10, pageWidth - margin * 2 + 20, 80, 'F');
    
    yPos += 5;
    addText('⚠ IMPORTANT : Ce rapport a été généré avec l\'assistance d\'une intelligence artificielle et doit être validé par un professionnel de santé.', 10, true, '#856404');
    
    addSpace(10);
    const legalText = `Ce système est un outil d'aide à la décision et ne remplace pas l'avis d'un médecin qualifié. Toute décision thérapeutique doit être prise par un professionnel de santé après examen clinique complet.`;
    addText(legalText, 9, false, '#856404');
    
    yPos += 20;

    // PIED DE PAGE
    const footerY = pageHeight - 60;
    doc.setDrawColor('#2c3e50');
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setTextColor('#7f8c8d');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('BreastCare AI - Version 2.1 (AI-Powered)', margin, footerY + 15);
    doc.text(`Rapport généré le ${currentDate.toLocaleString('fr-FR')}`, margin, footerY + 28);
    doc.text(`Référence : ${this.patientId}-${Date.now()}`, margin, footerY + 41);
    
    doc.text('Document confidentiel - Usage médical uniquement', pageWidth - margin, footerY + 28, { align: 'right' });

    // Générer le PDF en base64 pour sauvegarde
    pdfBase64 = doc.output('datauristring');
    
    // Sauvegarder le rapport dans l'historique
    this.saveReportToHistory(pdfBase64);

    // Télécharger le fichier
    const filename = `Rapport_AI_Medical_${this.patientId}_${currentDate.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  }

  private saveReportToHistory(pdfBase64: string): void {
    if (!this.currentUser || !this.result) {
      return;
    }

    // Trouver l'analyse la plus récente pour cet utilisateur avec le même patientId
    const userHistory = this.historyService.getHistoryByUser(this.currentUser.email);
    const latestAnalysis = userHistory.find(a => a.patientId === this.patientId);

    if (latestAnalysis) {
      // Mettre à jour l'analyse existante avec le rapport
      this.historyService.updateAnalysis(latestAnalysis.id, {
        reportPdf: pdfBase64,
        reportGenerated: true
      });
    }
  }

  reset(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.result = null;
    this.error = null;
    this.isUploading = false;
    this.loadingMessage = 'Analyse en cours...';
    this.imageDimensions = '';
    this.processingTime = '< 2s';
    this.progressPercent = 0;
    this.stopProgress();
    this.generatePatientId();
    this.cdr.detectChanges();
  }

  getConfidencePercentage(): number {
    if (!this.result) return 0;
    const confidence = this.result.confidence;
    return Math.round(confidence > 1 ? confidence : confidence * 100);
  }

  isPositive(): boolean {
    return this.result?.label.includes('POSITIF') || false;
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    return `Analyse complétée le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`;
  }

  private saveAnalysisToHistory(result: PredictionResult): void {
    if (!this.currentUser || !this.selectedFile || !this.previewUrl) {
      return;
    }

    this.historyService.addAnalysis({
      fileName: this.selectedFile.name,
      imageData: this.previewUrl, // base64 image data
      imageDimensions: this.imageDimensions,
      patientId: this.patientId,
      modelVersion: this.modelVersion,
      imageType: this.imageType,
      result: {
        label: result.label,
        confidence: result.confidence
      },
      processingTime: this.processingTime,
      reportGenerated: false // Le rapport sera généré plus tard si l'utilisateur le télécharge
    }, this.currentUser.email);
  }
}
