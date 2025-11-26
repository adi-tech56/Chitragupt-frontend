import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MedicationNormalized, PatientMedicationLogs, PrescriptionData, PrescriptionResponse, SuperPrescriptionData } from '../Models/Medication';

@Injectable({
  providedIn: 'root'
})
export class MedicationService {

  private baseUrl = 'http://localhost:8089/patient/prescriptions'; // Backend endpoint
  private logUrl = 'http://localhost:8089/patient/medication-logs';
  constructor(private http: HttpClient) { }

  savePrescription(prescriptionData: SuperPrescriptionData): Observable<any> {
    return this.http.post(`${this.baseUrl}/add-prescriptions`, prescriptionData, { withCredentials: true });
  }

  getPrescriptions(): Observable<MedicationNormalized[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.baseUrl}/prescription`).pipe(
      map(data => this.normalize(data))
    );
  }
  /** Flatten the backend structure to a single medication list */
  private normalize(data: PrescriptionResponse[]): MedicationNormalized[] {
    const meds: MedicationNormalized[] = [];

    data.forEach(entry => {
      entry.prescriptions.forEach(condition => {
        condition.medications.forEach(med => {
          meds.push({
            doctorName: entry.doctorName,
            prescriptionDate: entry.prescriptionDate,
            conditionName: condition.conditionName,
            conditionNotes: condition.notes,
            prescriptionId: entry.superPrescriptionId,
            prescriptionConditionId: condition.prescriptionId,
            ...med
          });
        });
      });
    });

    return meds;
  }
    getTodaysLogs(): Observable<PatientMedicationLogs[]> {
    return this.http.get<PatientMedicationLogs[]>(
      `${this.logUrl}/today`,
      { withCredentials: true }
    );
  }
  markMedication(
  superPrescriptionId: number,
  prescriptionId: number,
  statementId: number,
  taken: boolean
): Observable<PatientMedicationLogs> {
  return this.http.post<PatientMedicationLogs>(
    `${this.logUrl}/mark`,
    null,
    {
      params: {
        superPrescriptionId: superPrescriptionId.toString(),
        prescriptionId: prescriptionId.toString(),
        statementId: statementId.toString(),
        taken: taken.toString()
      },
      withCredentials: true
    }
  );
}


}
