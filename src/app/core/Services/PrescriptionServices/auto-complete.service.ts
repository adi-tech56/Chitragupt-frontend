import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutoCompleteService {
  
  private baseUrl = 'patient/medication';
  constructor(private http: HttpClient) { }

  //Medical Conditons Search
conditionSearch(term: string): Observable<string[]> {
  if (!term || term.length < 2) return of([]);

  return this.http.get<string[]>(`${this.baseUrl}/conditions`, { 
    params: { term },
    withCredentials: true
  });
}

  //Medicine Search
  medicineSearch(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medicine-search?q=${term}`, { withCredentials: true });
  }

  //Route Search

  routeSearch(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/route-search?q=${term}`, {withCredentials: true});
  }

  //AmountSearch
    amountSearch(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/amount-code-search?q=${term}`, {withCredentials: true});
  }
}
