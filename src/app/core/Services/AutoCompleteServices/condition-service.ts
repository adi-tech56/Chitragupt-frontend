// src/app/services/condition.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConditionService {

  private apiUrl = 'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search';

  constructor(private http: HttpClient) {}

  search(term: string): Observable<string[]> {
    if (!term || term.length < 2) return of([]);

    return this.http.get<any>(this.apiUrl, {
      params: { terms: term, maxList: '20' }
    }).pipe(
      map(result => result[3] || [])
    );
  }
}



// Ts.file
// Form control
//  control: ['']   // <-- your autocomplete form control
// ngOnInit(){
//   this.contactForm.get('control')?.valueChanges.pipe(
//     debounceTime(100),
//     switchMap((text: string) => this.conditionService.search(text))
//   )
//   .subscribe(data => {
//     this.suggestions = data;
//   });
// }
// select(value: string) {
//   this.contactForm.get('control')?.setValue(value);
//   this.suggestions = [];
//   console.log(value);
// }
// html
          // <div class="autocomplete-container">
          //   <input type="text" formControlName="control" placeholder="Search medical condition" />

          //   <ul *ngIf="suggestions.length > 0" class="dropdown">
          //     <li *ngFor="let item of suggestions" (click)="select(item)">
          //       {{ item }}
          //     </li>
          //   </ul>
          // </div>