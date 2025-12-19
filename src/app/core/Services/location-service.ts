import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PostalLookupResult {
  city: string;
  state: string;
  country: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private baseUrl = 'api/location/postal'; // your Spring Boot endpoint

  constructor(private http: HttpClient) {}
lookupByPostalCode(countryCode: string, postalCode: string): Observable<PostalLookupResult> {
  return this.http
    .get<PostalLookupResult>(`${this.baseUrl}/${countryCode}/${postalCode}`, {
      headers: { skipLoader: 'true' } // add custom header here
    })
    .pipe(
      map((res) => res),
      catchError((err) => {
        console.error('Postal code lookup failed', err);
        return throwError(() => new Error(err?.error || 'Lookup failed'));
      })
    );
}

}
