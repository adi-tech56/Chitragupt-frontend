import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { debounceTime, switchMap, Observable, forkJoin, of } from 'rxjs';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { Location } from '@angular/common';
import { ToastService } from 'src/app/core/Services/toast.service';
import { ActivatedRoute } from '@angular/router';

function allergySelectedValidator() {
  return (control: AbstractControl) => {
    const valid = control.parent?.get('allergyValid')?.value;
    const touched = control.touched;

    if (touched && !valid) {
      return { conditionInvalid: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-allergy-forms',
  templateUrl: './allergy-forms.component.html',
  styleUrls: ['./allergy-forms.component.css'],
})
export class AllergyFormsComponent implements OnInit {
  @Output() allergySubmitted = new EventEmitter<void>();

  allergyForm: FormGroup;
  suggestions: any[][] = [];
  today = new Date().toISOString().split('T')[0];
  allergyId: number | null = null;
  private skipConditionFetch = false;

  constructor(
    private fb: FormBuilder,
    private allergyService: PatientAllergyService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private location: Location,
    private toaster: ToastService
  ) {
    this.allergyForm = this.fb.group({
      allergies: this.fb.array([]),
    });
  }

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    this.allergyId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.allergyId) {
      this.addAllergy();
      this.loadExistingAllergy(this.allergyId);
    } else {
      // ADD MODE
      this.addAllergy();
    }

    // this.setupAutocomplete();

    this.allergies.valueChanges.subscribe(() => {
      this.registerAutocompleteListeners();
    });
  }

  loadExistingAllergy(id: number) {
    this.allergyService.getAllergyById(id).subscribe((a) => {
      this.skipConditionFetch = true;

      const group = this.allergies.at(0);

      group.patchValue(
        {
          allergyName: a.allergyName,
          clinicalStatus: a.clinicalStatus,
          verificationStatus: a.verificationStatus,
          allergyType: a.allergyType,
          category: a.category,
          criticality: a.criticality,
          onsetDate: a.onsetDate,
          allergyValid: true  
        },
        { emitEvent: false }
      );
      this.suggestions[0] = [];
      setTimeout(() => (this.skipConditionFetch = false), 300);
    });
  }

  // private setupAutocomplete() {
  //   this.allergies.controls.forEach((group, index) => {
  //     const control = group.get('allergyName');

  //     if (!control) return;

  //     control.valueChanges
  //       .pipe(
  //         debounceTime(300),
  //         switchMap((value) => {
  //           if (!value || value.length < 2) return of([]);
  //           return this.allergyService.conditionSearch(value);
  //         })
  //       )
  //       .subscribe((list) => {
  //         this.suggestions[index] = list;
  //       });
  //   });
  // }

  resetForm() {
    while (this.allergies.length !== 0) {
      this.allergies.removeAt(0);
    }

    this.suggestions = [];

    this.addAllergy();
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
          .subscribe((data) => {
            this.suggestions[index] = data;
          });
      }
    });
  }

 selectAllergy(value: string, index: number) {
  const group = this.allergies.at(index) as FormGroup;
  const control = group.get('allergyName');

  control?.setValue(value, { emitEvent: false });


  group.get('allergyValid')?.setValue(true, { emitEvent: false });

 
  if (control?.hasError('conditionInvalid')) {
    const errors = { ...control.errors };
    delete errors['conditionInvalid'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  this.suggestions[index] = [];
  this.skipConditionFetch = true;
}


  get allergies(): FormArray {
    return this.allergyForm.get('allergies') as FormArray;
  }

  private createAllergyGroup(): FormGroup {
  const group = this.fb.group({
    allergyName: ['', [Validators.required, allergySelectedValidator()]],
    allergyValid: [false],
    clinicalStatus: ['', Validators.required],
    verificationStatus: ['', Validators.required],
    allergyType: ['', Validators.required],
    category: ['', Validators.required],
    criticality: ['', Validators.required],
    onsetDate: ['', [Validators.required, this.noFutureDateValidator()]],
  });
 group.get('allergyName')!.valueChanges.subscribe(() => {
  const ctrl = group.get('allergyName')!;
  group.get('allergyValid')!.setValue(false, { emitEvent: false });
  if (!ctrl.touched) {
    ctrl.markAsTouched({ onlySelf: true });
  }
});
  return group;
}

  noFutureDateValidator() {
    return (control: AbstractControl) => {
      if (!control.value) return null;

      const selected = new Date(control.value);
      const today = new Date();

      return selected > today ? { maxDate: true } : null;
    };
  }
  addAllergy() {
    this.allergies.push(this.createAllergyGroup());
    this.suggestions.push([]);
    // this.setupAutocomplete();
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
    if (this.allergyForm.invalid) {
      this.allergyForm.markAllAsTouched();
      this.toaster.show('Please fill all required fields..', 'error');
      return;
    }

    const firstAllergy = this.allergies.at(0).value;

    if (this.allergyId) {
      this.allergyService
        .updateAllergy(this.allergyId, firstAllergy)
        .subscribe({
          next: () => {
            this.toaster.show('Allergy updated successfully!', 'success');
            this.allergySubmitted.emit(); // notify parent to refresh list
          },
          error: () => {
            this.toaster.show('Error updating allergy.', 'error');
          },
        });

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
      next: () => {
        this.toaster.show('Your allergy has been saved!', 'success');
        this.resetForm();
        this.allergySubmitted.emit();
      },
      error: (err) => {
        this.toaster.show('Error in saving allergy', 'error');
      },
    });
  }
}
