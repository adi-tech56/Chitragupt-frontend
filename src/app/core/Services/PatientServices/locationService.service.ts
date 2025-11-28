import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LocationService {
  constructor(private http: HttpClient) {}

  getCountries(): Observable<string[]> {
    return this.http.get<string[]>('assets/data/countries.json');
  }

  getStates(): Observable<string[]> {
    return this.http.get<string[]>('assets/data/states.json');
  }

  getCities(): Observable<string[]> {
    return this.http.get<string[]>('assets/data/cities.json');
  }
}
