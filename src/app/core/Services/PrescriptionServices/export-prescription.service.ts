// medication.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExportPrescriptionService{

  private apiUrl = 'http://localhost:8089/patient/prescriptions';

  constructor(private http: HttpClient) {}

  downloadMedicationBundle(prescriptionId: number | number[]) {
      const body = Array.isArray(prescriptionId) ? prescriptionId : [prescriptionId];
    // POST request, responseType 'blob' for file download
    return this.http.post(`${this.apiUrl}/bundle-export`, body, {
      responseType: 'blob'
    });
  }
}
