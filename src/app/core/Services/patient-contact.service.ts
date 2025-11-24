import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientContactService {

  private baseUrl = "http://localhost:8089/patient/patient-contacts";

  constructor(private http: HttpClient) {}

  saveContact(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/save`, payload,{withCredentials: true});
  }

  getContact(): Observable<any> {
    return this.http.get(`${this.baseUrl}`,{withCredentials: true});
  }
}
