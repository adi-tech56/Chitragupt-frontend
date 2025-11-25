import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrescriptionData, SuperPrescriptionData } from '../Models/Medication';

@Injectable({
  providedIn: 'root'
})
export class MedicationService {

  private baseUrl = 'http://localhost:8089/patient/prescriptions'; // Backend endpoint

  constructor(private http: HttpClient) { }

  savePrescription(prescriptionData: SuperPrescriptionData): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-prescriptions`, prescriptionData,{withCredentials: true});
  }

  /**
   * Optionally: fetch prescriptions by patientId
   */
  getPrescriptionsByPatient(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}?patientId=${patientId}`);
  }
}
