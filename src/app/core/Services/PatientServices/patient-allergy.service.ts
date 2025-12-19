import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientAllergyService {
  private baseUrl = 'patient/allergy';

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

  deleteAllergy(slug: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${slug}`);
  }

  // ✅ UPDATE BY SLUG
  updateAllergy(slug: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${slug}`, payload);
  }

  // ✅ FETCH BY SLUG
  getAllergyBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${slug}`);
  }

  // AUTOCOMPLETE
  conditionSearch(term: string): Observable<string[]> {
    if (!term || term.length < 2) return of([]);

    return this.http.get<string[]>(`patient/medication/conditions`, {
      params: { term },
      withCredentials: true,
      headers: { skipLoader: 'true' },
    });
  }
}
