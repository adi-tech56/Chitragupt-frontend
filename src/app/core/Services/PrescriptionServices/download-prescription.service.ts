import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DownloadPrescriptionService {

  private apiUrl = 'patient/prescriptions/download'; // backend URL

  constructor(private http: HttpClient) {}

  downloadSuperPrescriptionPdf(superPrescriptionId: number) {
    return this.http.get(`${this.apiUrl}/${superPrescriptionId}/pdf`, {
      responseType: 'blob' 
    });
  }
}
