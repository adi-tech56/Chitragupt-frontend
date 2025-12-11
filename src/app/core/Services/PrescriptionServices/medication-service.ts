import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  MedicationNormalized,
  MedicationWithStatus,
  PatientMedicationLogs,
  PrescriptionData,
  PrescriptionResponse,
  SuperPrescriptionData,
} from '../../Models/Medication';

@Injectable({
  providedIn: 'root',
})
export class MedicationService {
  private baseUrl = 'patient/prescriptions'; // Backend endpoint
  private logUrl = 'patient/medication-logs';
  private reminderUrl =
    'patient/medication/send-reminder';

  constructor(private http: HttpClient) { }

  sendReminder(reminderData: any): Observable<any> {
    console.log(reminderData);
    return this.http.post(`${this.reminderUrl}`, reminderData);
  }

  savePrescription(prescriptionData: SuperPrescriptionData): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/add-prescriptions`,
      prescriptionData,
      { withCredentials: true }
    );
  }

  getPrescriptions(): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(
      `${this.baseUrl}/prescription`
    );
  }
  getMedicationById(id: string): Observable<PrescriptionResponse> {
    return this.http.get<PrescriptionResponse>(`${this.baseUrl}/prescription/${id}`);
  }


  getMedications(): Observable<MedicationWithStatus[]> {
    return this.http
      .get<MedicationWithStatus[]>(`${this.baseUrl}/daily-meds`);

  }
  updatePrescriptions(
    superPrescriptionId: number,
    prescription: PrescriptionResponse
  ): Observable<{ message: string }> {

    return this.http.put<{ message: string }>(
      `${this.baseUrl}/update-prescriptions/${superPrescriptionId}`,
      prescription
    );
  }

  markMedication(
    superPrescriptionId: number,
    prescriptionId: number,
    statementId: number,
    taken: boolean,
    doseTime: string // ISO string sent from frontend
  ): Observable<PatientMedicationLogs> {
    const body = {
      superPrescriptionId,
      prescriptionId,
      statementId,
      taken,
      doseTime,
    };

    return this.http.post<PatientMedicationLogs>(
      `${this.logUrl}/mark`,
      body, // send as request body
      { withCredentials: true }
    );
  }

  //Check prescription exist
  checkPrescriptionExists(): Observable<boolean> {
    return this.http
      .get<{ exists: boolean }>(`${this.baseUrl}/exists`)
      .pipe(map((res) => res.exists));
  }
}
