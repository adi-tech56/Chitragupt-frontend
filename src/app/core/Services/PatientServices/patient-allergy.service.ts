import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientAllergyService {
  private baseUrl = 'http://localhost:8089/patient/allergy';

  constructor(private http: HttpClient) {}

  saveAllergy(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/save`, payload);
  }

  // USER SELECTED "NO"
  markNoAllergy(): Observable<any> {
    return this.http.post(`${this.baseUrl}/no`, {});
  }

  // CHECK IF USER ALREADY ANSWERED
  getAllergyStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/status`);
  }

  // LIST EXISTING ALLERGIES
  getAllergy(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // DELETE ALLERGY
  deleteAllergy(allergyId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${allergyId}`);
  }

  updateAllergy(allergyId: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${allergyId}`, payload);
  }

  getAllergyById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // AUTOCOMPLETE
  conditionSearch(term: string): Observable<string[]> {
    if (!term || term.length < 2) return of([]);

    return this.http.get<string[]>(
      `http://localhost:8089/patient/medication/conditions`,
      {
        params: { term },
        withCredentials: true,
      }
    );
  }
}
