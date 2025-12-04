// medication.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExportPrescriptionService {

  private apiUrl = 'http://localhost:8089/patient';

  constructor(private http: HttpClient) { }

  downloadMedicationBundle(prescriptionId: number | number[]) {
    const body = Array.isArray(prescriptionId) ? prescriptionId : [prescriptionId];

    return this.http.post(`${this.apiUrl}/fhir/bundle-medication`, body, {
      responseType: 'blob'
    });
  }
  downloadPatientBundle() {
    return this.http.post(`${this.apiUrl}/fhir/bundle-patient`,{}, {
      responseType: 'blob'
    });
  }
}
