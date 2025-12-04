import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  debounceTime,
  switchMap,
  Observable,
  forkJoin,
  of,
} from 'rxjs';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-allergy-forms',
  templateUrl: './allergy-forms.component.html',
  styleUrls: ['./allergy-forms.component.css']
})
export class AllergyFormsComponent implements OnInit {
  @Output() allergySubmitted = new EventEmitter<void>();

  allergyForm: FormGroup;
  suggestions: any[][] = [];
  private skipConditionFetch = false;

  constructor(
    private fb: FormBuilder,
    private allergyService: PatientAllergyService,
    private auth: AuthService,
    private location:Location
  ) {
    this.allergyForm = this.fb.group({
      allergies: this.fb.array([]),
    });
  }
  goBack() {
    this.location.back();
  }
  ngOnInit() {
    if (this.allergies.length === 0) {
      this.addAllergy();
    }

    this.allergies.valueChanges.subscribe(() => {
      this.registerAutocompleteListeners();
    });
  }


  private registerAutocompleteListeners() {
    this.allergies.controls.forEach((group, index) => {
      const control = group.get('allergyName');

      if (control && !(control as any)._autocompleteBound) {
        (control as any)._autocompleteBound = true;

        control.valueChanges
          .pipe(
            debounceTime(200),
            switchMap((text) => {
              if (!text || text.length < 2 || this.skipConditionFetch) {
                this.skipConditionFetch = false;
                return of([]);
              }
              return this.allergyService.conditionSearch(text);
            })
          )
          .subscribe((data) => {
            this.suggestions[index] = data;
          });
      }
    });
  }

  selectAllergy(value: string, index: number) {
    this.allergies.at(index).get('allergyName')?.setValue(value);
    this.suggestions[index] = [];
    this.skipConditionFetch = true;
  }

  get allergies(): FormArray {
    return this.allergyForm.get('allergies') as FormArray;
  }

  private createAllergyGroup(): FormGroup {
    return this.fb.group({
      allergyName: ['', Validators.required],
      clinicalStatus: ['', Validators.required],
      verificationStatus: ['', Validators.required],
      allergyType: ['', Validators.required],
      category: ['', Validators.required],
      criticality: ['', Validators.required],
      onsetDate: ['', Validators.required],
    });
  }


  addAllergy() {
    this.allergies.push(this.createAllergyGroup());
    this.suggestions.push([]);
    this.registerAutocompleteListeners();
  }

  removeAllergy(index: number) {
    if (this.allergies.length > 1) {
      this.allergies.removeAt(index);
      this.suggestions.splice(index, 1);
    } else {
      // Keep at least one row always
      this.allergies.clear();
      this.addAllergy();
    }
  }


  onSubmit() {
    if (this.allergies.invalid) {
      this.allergies.markAllAsTouched();
      alert('Please fill all required fields.');
      return;
    }

    const calls: Observable<any>[] = this.allergies.value.map((a: any) =>
      this.allergyService.saveAllergy({
        allergyName: a.allergyName,
        clinicalStatus: a.clinicalStatus,
        verificationStatus: a.verificationStatus,
        allergyType: a.allergyType,
        category: a.category,
        criticality: a.criticality,
        onsetDate: a.onsetDate,
      })
    );

    forkJoin(calls).subscribe({
      next: () => this.allergySubmitted.emit(),
      error: (err) => {
        console.error('Failed to save allergy:', err);
        alert('Error saving allergy. Check console.');
      },
    });
  }
}

