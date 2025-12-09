// src/app/features/patient-allergy/patient-allergy.component.ts

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, switchMap, Observable, forkJoin, of } from 'rxjs';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { ToastService } from 'src/app/core/Services/toast.service';
function allergySelectedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const reasonValid = control.parent?.get('allergyValid')?.value;
    const touched = control.touched;

    if (touched && !reasonValid) {
      return { conditionInvalid: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-patient-allergy',
  templateUrl: './patient-allergy.component.html',
  styleUrls: ['./patient-allergy.component.css'],
})
export class PatientAllergyComponent implements OnInit {
  @Output() allergySubmitted = new EventEmitter<void>();
  private skipConditionFetch = false;
  currentStep = 1;
  maxStep = 2;

  suggestions: any[][] = [];
  allergyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private allergyService: PatientAllergyService,
    private auth: AuthService,
    private toaster: ToastService
  ) {
    this.allergyForm = this.fb.group({
      hasAllergy: ['', Validators.required],
      allergies: this.fb.array([]),
    });
  }

  ngOnInit() {
    this.allergyService.getAllergyStatus().subscribe({
      next: (res) => {
        if (res.hasAnswered) {
          // Emit to parent and stop showing the form
          this.allergySubmitted.emit();
        }
      },
      error: (err) => console.error('Status check failed:', err),
    });

    // Keep autocomplete registration
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
        switchMap(text => {
          group.get('allergyValid')?.setValue(false, { emitEvent: false });

          if (!text || text.length < 2 || this.skipConditionFetch) {
            this.skipConditionFetch = false;
            return of([]);
          }

          return this.allergyService.conditionSearch(text);
        })
      )
      .subscribe(data => {
        this.suggestions[index] = data;
      });
  }
});
}

selectAllergy(value: string, index: number) {
  const group = this.allergies.at(index) as FormGroup;

  group.get('allergyName')?.setValue(value, { emitEvent: false });
  group.get('allergyValid')?.setValue(true, { emitEvent: false });
  const ctrl = group.get('allergyName');
  if (ctrl?.hasError('conditionInvalid')) {
    const errors = { ...ctrl.errors };
    delete errors['conditionInvalid'];
    ctrl.setErrors(Object.keys(errors).length ? errors : null);
  }
    this.suggestions[index] = [];
    this.skipConditionFetch = true;
  }

  get allergies(): FormArray {
    return this.allergyForm.get('allergies') as FormArray;
  }

  private createAllergyGroup(): FormGroup {
    return this.fb.group({
      allergyName:  ['', [Validators.required, allergySelectedValidator()]],
      allergyValid: [false],
      clinicalStatus: ['', Validators.required],
      verificationStatus: ['', Validators.required],
      allergyType: ['', Validators.required],
      category: ['', Validators.required],
      criticality: ['', Validators.required],
      onsetDate: ['', Validators.required],
    });
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.allergyForm.get('hasAllergy')?.invalid) {
        this.allergyForm.get('hasAllergy')?.markAsTouched();
        return;
      }

      if (
        this.allergyForm.get('hasAllergy')?.value === 'yes' &&
        this.allergies.length === 0
      ) {
        this.addAllergy();
      }

      this.currentStep = 2;
    }
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  addAllergy() {
    this.allergies.push(this.createAllergyGroup());
    this.suggestions.push([]); // create suggestion array for this row
    this.registerAutocompleteListeners();
  }

  removeAllergy(index: number) {
    if (this.allergies.length > 1) {
      this.allergies.removeAt(index);
      this.suggestions.splice(index, 1);
    } else {
      this.allergies.clear();
      this.addAllergy();
    }
  }

  onSubmit() {
    const has = this.allergyForm.get('hasAllergy')?.value;

    if (has === 'no') {
      this.allergyService.markNoAllergy().subscribe({
        next: () => this.allergySubmitted.emit(),
        error: (err) => console.error('Failed to mark no allergy:', err),
      });
      return;
    }

    if (this.allergies.invalid) {
      this.allergies.markAllAsTouched();
      this.toaster.show('Please fill all required fields.', 'error');
      return;
    }

    const calls: Observable<any>[] = this.allergies.value.map((a: any) => {
      return this.allergyService.saveAllergy({
        allergyName: a.allergyName,
        clinicalStatus: a.clinicalStatus,
        verificationStatus: a.verificationStatus,
        allergyType: a.allergyType,
        category: a.category,
        criticality: a.criticality,
        onsetDate: a.onsetDate,
      });
    });

    forkJoin(calls).subscribe({
      next: () => {
        this.toaster.show('Allergy saved successfully!', 'success');
        this.allergySubmitted.emit();
      },
      error: (err) => {
        console.error('Failed to save allergy:', err);
        this.toaster.show('Something went wrong. Try again.', 'error');
      },
    });
  }
}
