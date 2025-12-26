import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, PredictionResult } from '../../services/api.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
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
  private progressInterval: any = null;
  private progressStartTime: number = 0;
  private readonly MIN_PROGRESS_MS = 2000; // minimum animation duration

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.generatePatientId();
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

 generateMedicalReport(): void {
  if (!this.result) return;

  const isPositive = this.result.is_positive;
  const confidence = this.getConfidencePercentage();
  const currentDate = new Date();
  
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  let yPos = margin;

  // Fonction helper pour ajouter du texte avec gestion des pages
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000', maxWidth?: number) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    const textWidth = maxWidth || (pageWidth - margin * 2);
    const lines = doc.splitTextToSize(text, textWidth);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 50) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += fontSize * 1.4;
    });
  };

  const addSpace = (space: number = 10) => {
    yPos += space;
  };

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

  // ========================
  // EN-TÊTE
  // ========================
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT D\'ANALYSE MÉDICALE', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Détection du Cancer du Sein - Intelligence Artificielle', pageWidth / 2, 55, { align: 'center' });
  
  yPos = 100;

  // ========================
  // INFORMATIONS DU PATIENT
  // ========================
  addSection('INFORMATIONS DU PATIENT');
  
  const patientInfo = [
    ['Identifiant Patient', this.patientId],
    ['Date d\'analyse', currentDate.toLocaleDateString('fr-FR')],
    ['Heure', currentDate.toLocaleTimeString('fr-FR')],
    ['Type d\'examen', this.result.image_type]
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

  // ========================
  // PROFESSIONNEL DE SANTÉ
  // ========================
  addSection('PROFESSIONNEL DE SANTÉ');
  
  const professionalInfo = [
    ['Médecin prescripteur', 'Dr. [NOM DU MÉDECIN]'],
    ['Spécialité', 'Oncologie / Radiologie'],
    ['Établissement', '[NOM DE L\'ÉTABLISSEMENT]'],
    ['Contact', '[TÉLÉPHONE / EMAIL]']
  ];

  professionalInfo.forEach(([label, value]) => {
    doc.setTextColor('#666666');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(label + ' :', margin, yPos);
    
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 150, yPos);
    yPos += 20;
  });

  // ========================
  // RÉSULTAT DU DIAGNOSTIC
  // ========================
  addSection('RÉSULTAT DU DIAGNOSTIC');
  
  // Encadré du résultat
  const resultColor = isPositive ? '#e74c3c' : '#27ae60';
  doc.setFillColor(resultColor);
  doc.rect(margin - 10, yPos - 10, pageWidth - margin * 2 + 20, 60, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(this.result.label, pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confiance : ${confidence}%`, pageWidth / 2, yPos + 35, { align: 'center' });
  
  yPos += 80;

  // ========================
  // DÉTAILS DE L'ANALYSE
  // ========================
  addSection('DÉTAILS DE L\'ANALYSE');
  
  const analysisDetails = [
    ['Modèle IA', `CNN (${this.result.model_version})`],
    ['Dimensions image', this.imageDimensions],
    ['Nom du fichier', this.selectedFile?.name || 'N/A'],
    ['Temps de traitement', this.processingTime],
    ['Niveau de confiance', this.result.confidence_level],
    ['Classification', isPositive ? 'POSITIF - Anomalie détectée' : 'NÉGATIF - Aucune anomalie']
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

  // ========================
  // INTERPRÉTATION CLINIQUE
  // ========================
  addSection('INTERPRÉTATION CLINIQUE');
  
  addText(this.result.interpretation, 10, false, '#333333');

  // ========================
  // RECOMMANDATIONS
  // ========================
  addSection('RECOMMANDATIONS MÉDICALES');
  
  this.result.recommendations.forEach(rec => {
    const cleanRec = rec.replace(/\s+/g, ' ').trim();
    addText(cleanRec, 10, false, isPositive ? '#c0392b' : '#27ae60');
  });

  // ========================
  // AVERTISSEMENT LÉGAL
  // ========================
  addSection('AVERTISSEMENT LÉGAL');
  
  doc.setFillColor(255, 243, 205);
  doc.rect(margin - 10, yPos - 10, pageWidth - margin * 2 + 20, 120, 'F');
  
  yPos += 5;
  const warningTitle = '⚠ IMPORTANT : Ce système est un outil d\'aide à la décision médicale et ne remplace EN AUCUN CAS l\'avis d\'un professionnel de santé qualifié.';
  addText(warningTitle, 10, true, '#856404');
  
  addSpace(10);
  const legalText = 'Ce résultat doit être interprété par un médecin compétent. Un diagnostic définitif nécessite un examen clinique complet. L\'exactitude du modèle IA peut varier selon la qualité de l\'image. Toute décision thérapeutique doit être prise par un professionnel. La confidentialité des données patient est strictement protégée.';
  addText(legalText, 9, false, '#856404');
  
  yPos += 20;

  // ========================
  // INFORMATIONS TECHNIQUES
  // ========================
  addSection('PERFORMANCES DU MODÈLE');
  
  const technicalInfo = [
    ['Architecture', this.result.model_performance.architecture],
    ['Base d\'entraînement', this.result.model_performance.training_dataset],
    ['Précision globale', this.result.model_performance.accuracy],
    ['Sensibilité', this.result.model_performance.sensitivity],
    ['Spécificité', this.result.model_performance.specificity]
  ];

  technicalInfo.forEach(([label, value]) => {
    doc.setTextColor('#666666');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label + ' :', margin, yPos);
    
    doc.setTextColor('#000000');
    doc.text(value, margin + 150, yPos);
    yPos += 16;
  });

  // ========================
  // PIED DE PAGE
  // ========================
  const footerY = pageHeight - 60;
  doc.setDrawColor('#2c3e50');
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setTextColor('#7f8c8d');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BreastCare AI - Version 2.1', margin, footerY + 15);
  doc.text(`Rapport généré le ${currentDate.toLocaleString('fr-FR')}`, margin, footerY + 28);
  doc.text(`Référence : ${this.patientId}-${Date.now()}`, margin, footerY + 41);
  
  doc.text('Document confidentiel - Usage médical uniquement', pageWidth - margin, footerY + 28, { align: 'right' });

  // Sauvegarde
  const filename = `Rapport_Medical_${this.patientId}_${currentDate.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
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
    return this.result?.is_positive || false;
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
}
