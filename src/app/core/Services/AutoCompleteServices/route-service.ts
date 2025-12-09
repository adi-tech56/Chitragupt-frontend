import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  constructor(private http: HttpClient) {}

  search(term: string): Observable<any[]> {
    return this.http.get<any[]>(`patient/medication/route-search?q=${term}`, {withCredentials: true});
  }
}
