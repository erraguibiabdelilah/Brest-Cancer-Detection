import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionResult {
  label: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  predictImage(file: File): Observable<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);

    console.log('📤 [API Service] Envoi de la requête à:', `${this.apiUrl}/predict`);
    console.log('📤 [API Service] Fichier:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, formData);
  }
}

