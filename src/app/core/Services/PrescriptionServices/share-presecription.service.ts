// src/app/core/services/emergency-share.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmergencyContactPatientDto } from '../../Models/Medication';

@Injectable({
  providedIn: 'root',
})
export class SharePrescriptionService {
  private readonly API_BASE = 'patient/sharedContact';

  constructor(private http: HttpClient) {}

  getSharedPatients(): Observable<EmergencyContactPatientDto[]> {
    return this.http.get<EmergencyContactPatientDto[]>(`${this.API_BASE}`);
  }

  getPrescriptionsByPatient(patientId: number): Observable<any> {
    return this.http.get(`${this.API_BASE}/view/${patientId}`);
  }
}
