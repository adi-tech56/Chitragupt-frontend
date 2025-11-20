import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MedicineService {

  constructor(private http: HttpClient) {}

  search(term: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8089/patient/medication/medicine-search?q=${term}`, {withCredentials: true});
  }
}


// ts

//   suggestions:Medicine[] = [];
//     selectedMedicine: Medicine = {brandName:"",
//       medicationId:0
//     };


//         this.contactForm.get('medicineControl')?.valueChanges.pipe(
//           debounceTime(300),
//           distinctUntilChanged(),
//           switchMap(value =>
//             value && value.length > 1
//               ? this.medicineService.search(value)
//               : of([])
//           )
//         ).subscribe((data:Medicine[]) => {
//           console.log("SUGGESTIONS:", data);
//           this.suggestions = data;
//         });

//          selectMedicine(med: Medicine) {
        
//             this.contactForm.get('medicineControl')?.setValue(med.brandName);
//             this.selectedMedicine = med;
//             this.suggestions = []; // close dropdown
//             console.log("Selected:", med);
//           }
        

//           //html
//           <div class="autocomplete-container">

//   <input 
//     type="text"
//     class="autocomplete-input"
//     placeholder="Search medicine..."
//     formControlName="medicineControl"
//   />

//   <ul *ngIf="suggestions.length > 0" class="autocomplete-list">
//     <li 
//       *ngFor="let med of suggestions" 
//       (click)="selectMedicine(med)"
//     >
//       {{ med.brandName}}  
     
//     </li>
//   </ul>

// </div>
