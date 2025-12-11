import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientProfileService {

  private BASE_URL = 'patient/profile';

  constructor(private http: HttpClient) {}

getProfile(): Observable<any> {
  return this.http.get(this.BASE_URL, { withCredentials: true });
}

saveProfile(patientId: number, payload: any): Observable<any> {
  return this.http.put(`${this.BASE_URL}/save/${patientId}`, payload, {
    withCredentials: true,
  });
}

  deleteTelecom(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/telecoms/${id}`);
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/address/${id}`);
  }
}
