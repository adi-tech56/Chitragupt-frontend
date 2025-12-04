import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, of, Subscription, switchMap, timer } from 'rxjs';
import { Amount, Medicine, Route, SuperPrescriptionData } from 'src/app/core/Models/Medication';
import { AutoCompleteService } from 'src/app/core/Services/PrescriptionServices/auto-complete.service';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
// Checks if the value is a valid date
function dateValidator(control: AbstractControl) {
  const value = control.value;
  if (!value) return null; // required is handled separately
  const date = new Date(value);
  return isNaN(date.getTime()) ? { invalidDate: true } : null;
}

function dateRangeValidator(minDate: Date, maxDate: Date) {
  return (control: AbstractControl) => {
    const value = control.value;
    if (!value) return null; // required is handled separately

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return { invalidDate: true }; // not a valid date
    }

    if (date < minDate) {
      return { minDateExceeded: true }; // date is before allowed min
    }

    if (date > maxDate) {
      return { maxDateExceeded: true }; // date is after allowed max
    }

    return null; // valid
  };
}



@Component({
  selector: 'app-add-medication',
  templateUrl: './add-medication.component.html',
  styleUrls: ['./add-medication.component.css']
})
export class AddMedicationComponent implements OnInit, OnDestroy {

  superPrescription: FormGroup;
  currentStep = 0;
  timingDescriptions: string[][] = [];
  conditions: any[] = [];
  medicines: Medicine[] = [];
  whenCode: any[] = [];
  periodUnit: any[] = [];
  amountUnit: any[] = [];
  routeUnit: any[] = [];

  private skipConditionFetch = false;
  private skipMedicineFetch = false;
  private skipAmountCodeFetch = false;
  private skipRouteCodeFetch = false;

  private reasonSubscriptions: Subscription[] = [];
  private medicineSubscriptions: Subscription[] = [];
  private amountSubscriptions: Subscription[] = [];
  private routeSubscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private medicationService: MedicationService,
    private http: HttpClient,
    private autoComplete: AutoCompleteService,
    private location: Location
  ) {
    this.superPrescription = this.fb.group({
      doctorName: ['', Validators.required],

      prescriptionDate: ['', [  
      Validators.required,
      dateValidator,
      dateRangeValidator(new Date('1700-01-01'), new Date('2040-12-31'))
    ]],
      notes: [''],
      prescription: this.fb.array([this.createPrescriptionGroup()])
    });
  }
  goBack() {
    this.location.back();
  }
  ngOnInit(): void {
    this.http.get<any[]>('assets/when-code.json').subscribe(data => this.whenCode = data);
    this.http.get<any[]>('assets/period-unit.json').subscribe(data => this.periodUnit = data);

    this.subscribeReasonValueChanges(0);
    this.subscribeMedicineValueChanges(0);
    this.subscribeRouteValueChanges(0);
    this.subscribeAmountValueChanges(0);
    this.prescriptions.controls.forEach((_, presIndex) => {
      this.initTimingDescriptions(presIndex);
    });
  }

  ngOnDestroy(): void {
    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.medicineSubscriptions.forEach(s => s.unsubscribe());
  }
  generateTimingDescription(timingGroup: FormGroup): string {
    if (!timingGroup) return '';

    const values = timingGroup.value;
    if (!values.frequency || !values.period || !values.periodUnit) return '';

    let desc = `Take ${values.frequency} time${values.frequency > 1 ? 's' : ''} every ${values.period} ${values.periodUnit}${values.period > 1 ? 's' : ''}`;

    if (values.timeOfDay) {
      const [hour, minute, second] = values.timeOfDay.split(':');

      const hour12 = Number(hour) % 12 || 12;
      const ampm = Number(hour) < 12 ? 'AM' : 'PM';
      desc += ` at ${hour12}:${minute}${second && second !== '00' ? ':' + second : ''} ${ampm}`;
    }

    if (values.whenCode && values.whenCode !== 'anytime') {
      const when = this.whenCode.find(w => w.value === values.whenCode)?.display;
      desc += ` (${when})`;
    }

    return desc;
  }
  initTimingDescriptions(presIndex: number) {
    const medsArray = this.getMedications(presIndex);
    if (!this.timingDescriptions[presIndex]) {
      this.timingDescriptions[presIndex] = [];
    }

    medsArray.controls.forEach((medGroup, medIndex) => {
      const timingGroup = (medGroup as FormGroup).get('timing') as FormGroup;

      // Initialize description
      this.timingDescriptions[presIndex][medIndex] = this.generateTimingDescription(timingGroup);

      // Subscribe to changes
      timingGroup.valueChanges.subscribe(() => {
        this.timingDescriptions[presIndex][medIndex] = this.generateTimingDescription(timingGroup);
      });
    });
  }


  // ---------------- Form Builders ----------------
  createPrescriptionGroup(): FormGroup {
    return this.fb.group({
      reason: ['', Validators.required],
      reasonValid: [false, Validators.requiredTrue],
      notes: [''],
      medications: this.fb.array([this.createMedicationGroup()])
    });
  }

  createMedicationGroup(): FormGroup {
    return this.fb.group({
      medicationId: [null, Validators.required],
      medicationName: [''],
   effectiveStartDate: ['', [  
      Validators.required,
      dateValidator,
      dateRangeValidator(new Date('1700-01-01'), new Date('2040-12-31'))
    ]],
    effectiveEndDate: ['', [
      Validators.required,
      dateValidator,
      dateRangeValidator(new Date('1700-01-01'), new Date('2040-12-31'))
    ]],
      status: ['ACTIVE', Validators.required],
      dosage: this.fb.group({
        amount: [null, Validators.required],
        amountUnitName: [''],
        amountUnitId: [null, Validators.required],
        routeName: [''],
        routeId: [null, Validators.required],
        instruction: ['']
      }),
      timing: this.fb.group({
        frequency: [null, Validators.required],
        period: [null, Validators.required],
        periodUnit: ['', Validators.required],
        timeOfDay: [''],
        whenCode: ['']
      })
    });
  }

  // ---------------- Getters ----------------
  get prescriptions(): FormArray {
    return this.superPrescription.get('prescription') as FormArray;
  }

  getMedications(presIndex: number): FormArray {
    return this.prescriptions.at(presIndex).get('medications') as FormArray;
  }
  getMedicationControl(stepIndex: number, medIndex: number, controlName: string): AbstractControl | null {
    const medsArray = this.getMedications(stepIndex);
    if (!medsArray) return null;
    const medGroup = medsArray.at(medIndex) as FormGroup;
    if (!medGroup) return null;
    return medGroup.get(controlName);
  }


  get currentPrescriptionGroup(): FormGroup {
    return this.prescriptions.at(this.currentStep) as FormGroup;
  }

  // ---------------- Navigation ----------------
  nextStep() {
    if (this.currentStep < this.prescriptions.length - 1) {
      this.currentStep++;
      this.subscribeReasonValueChanges(this.currentStep);
      this.subscribeMedicineValueChanges(this.currentStep);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.subscribeReasonValueChanges(this.currentStep);
      this.subscribeMedicineValueChanges(this.currentStep);
    }
  }

  addNewPrescription() {
    this.prescriptions.push(this.createPrescriptionGroup());
    this.currentStep = this.prescriptions.length - 1;
    this.subscribeReasonValueChanges(this.currentStep);
    this.subscribeMedicineValueChanges(this.currentStep);
    this.initTimingDescriptions(this.currentStep);
  }

  removePrescription(index: number) {
    this.prescriptions.removeAt(index);

    if (this.currentStep >= this.prescriptions.length) {
      this.currentStep = this.prescriptions.length - 1;
    }

    if (this.prescriptions.length > 0) {
      this.subscribeReasonValueChanges(this.currentStep);
      this.subscribeMedicineValueChanges(this.currentStep);
    }
  }

  addMedication(presIndex: number) {
    this.getMedications(presIndex).push(this.createMedicationGroup());
    this.subscribeMedicineValueChanges(presIndex);
    this.initTimingDescriptions(presIndex); //
  }

  removeMedication(presIndex: number, medIndex: number) {
    this.getMedications(presIndex).removeAt(medIndex);
    this.subscribeMedicineValueChanges(presIndex);
  }


  subscribeReasonValueChanges(stepIndex: number) {

    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.reasonSubscriptions = [];

    const control = (this.prescriptions.at(stepIndex) as FormGroup).get('reason');
    if (!control) return;
    const sub = control.valueChanges.pipe(
      debounceTime(200),
      switchMap(text => {
        (this.prescriptions.at(stepIndex) as FormGroup).get('reasonValid')?.setValue(false, { emitEvent: false });
        if (!text || text.length < 2 || this.skipConditionFetch) {
          this.skipConditionFetch = false;
          return of([]);
        }
        return this.autoComplete.conditionSearch(text);
      })
    ).subscribe(data => this.conditions = data);

    this.reasonSubscriptions.push(sub);


    this.reasonSubscriptions.push(sub);
  }
  selectCondition(cond: any) {
    const group = this.prescriptions.at(this.currentStep) as FormGroup;

    group.get('reason')?.setValue(cond.name || cond, { emitEvent: false });
    group.get('reasonValid')?.setValue(true);  // VALID ✔

    this.conditions = [];
    this.skipConditionFetch = true;
  }

  /** MEDICINE AUTOCOMPLETE */
  subscribeMedicineValueChanges(stepIndex: number) {
    this.medicineSubscriptions.forEach(s => s.unsubscribe());
    this.medicineSubscriptions = [];

    const medsArray = this.getMedications(stepIndex);

    medsArray.controls.forEach(medGroup => {
      const control = medGroup.get('medicationName');
      if (!control) return;

      const sub = control.valueChanges.pipe(
        debounceTime(200),
        switchMap(term => {
          if (!term || term.length < 2 || this.skipMedicineFetch) {
            this.skipMedicineFetch = false;
            return of([]);
          }
          return this.autoComplete.medicineSearch(term);
        })
      ).subscribe(data => this.medicines = data);

      this.medicineSubscriptions.push(sub);
    });
  }
  onMedicineInput(event: Event, stepIndex: number, medIndex: number) {
    const value = (event.target as HTMLInputElement).value;
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;

    // Reset medicineId whenever user types manually
    medGroup.get('medicationId')?.setValue(null);

    if (value && value.length > 1) {
      this.autoComplete.medicineSearch(value).subscribe(data => {
        this.medicines = data;
        if (!data || data.length === 0) {
          medGroup.get('medicationId')?.setErrors({ notFound: true });
        } else {
          medGroup.get('medicationId')?.setErrors(null); // clear errors while typing
        }
      });

    } else {
      this.medicines = [];
      medGroup.get('medicationName')?.setValue('');
    }
  }

  selectMedicine(med: Medicine, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;

    medGroup.get('medicationId')?.setValue(med.medicationId);
    medGroup.get('medicationName')?.setValue(med.brandName);
    medGroup.get('medicationId')?.setErrors(null);
    this.medicines = [];
    this.skipMedicineFetch = true;
  }


  currentMedicineName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    return medGroup.get('medicationName')?.value || '';
  }



  // ---------------- AMOUNT AUTOCOMPLETE ----------------
  subscribeAmountValueChanges(stepIndex: number) {
    this.amountSubscriptions.forEach(s => s.unsubscribe());
    this.amountSubscriptions = [];

    const medsArray = this.getMedications(stepIndex);

    medsArray.controls.forEach((medGroup, medIndex) => {
      const control = (medGroup.get('dosage') as FormGroup).get('amountUnitName');
      if (!control) return;

      const sub = control.valueChanges.pipe(
        debounceTime(200),
        switchMap(term => {
          if (!term || term.length < 2 || this.skipAmountCodeFetch) {
            this.skipAmountCodeFetch = false;
            return of([]);
          }
          return this.autoComplete.amountSearch(term); // call API
        })
      ).subscribe(data => {
        this.amountUnit = data;
      });

      this.amountSubscriptions.push(sub);
    });
  }

  onAmountUnitInput(event: Event, stepIndex: number, medIndex: number) {
    const value = (event.target as HTMLInputElement).value;
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    // Reset the amountUnitId whenever user types manually
    dosageGroup.get('amountUnitId')?.setValue(null);

    if (value && value.length > 1) {
      this.autoComplete.amountSearch(value).subscribe(data => {
        this.amountUnit = data;

        // If no results found, mark as invalid
        if (!data || data.length === 0) {
          dosageGroup.get('amountUnitId')?.setErrors({ notFound: true });
        } else {
          dosageGroup.get('amountUnitId')?.setErrors(null); // clear previous errors
        }
      });
    } else {
      this.amountUnit = [];
      dosageGroup.get('amountUnitId')?.setValue(null);
      dosageGroup.get('amountUnitName')?.setValue('');
    }
  }

  selectAmountUnit(unit: Amount, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    // Set the selected amount unit
    dosageGroup.get('amountUnitId')?.setValue(unit.conceptId);
    dosageGroup.get('amountUnitName')?.setValue(unit.conceptName);

    // Clear validation error
    dosageGroup.get('amountUnitId')?.setErrors(null);

    this.amountUnit = [];
    this.skipAmountCodeFetch = true;
  }

  getAmountControl(stepIndex: number, medIndex: number, controlName: string): AbstractControl | null {
    const medsArray = this.getMedications(stepIndex);
    if (!medsArray) return null;

    const medGroup = medsArray.at(medIndex) as FormGroup;
    if (!medGroup) return null;

    const dosageGroup = medGroup.get('dosage') as FormGroup;
    if (!dosageGroup) return null;

    return dosageGroup.get(controlName);
  }

  currentAmountUnitName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    return dosageGroup.get('amountUnitName')?.value || '';
  }

  /**ROUTE AUTOCOMPLETE */
  subscribeRouteValueChanges(stepIndex: number) {
    this.routeSubscriptions.forEach(s => s.unsubscribe());
    this.routeSubscriptions = [];

    const medsArray = this.getMedications(stepIndex);

    medsArray.controls.forEach(medGroup => {
      const control = medGroup.get('dosage.routeName');
      if (!control) return;

      const sub = control.valueChanges.pipe(
        debounceTime(200),
        switchMap(term => {
          if (!term || term.length < 2 || this.skipRouteCodeFetch) {
            this.skipRouteCodeFetch = false;
            return of([]);
          }
          return this.autoComplete.routeSearch(term);
        })
      ).subscribe(data => this.routeUnit = data);

      this.routeSubscriptions.push(sub);
    });
  }

  onRouteInput(event: Event, stepIndex: number, medIndex: number) {
    const value = (event.target as HTMLInputElement).value;
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    // Reset routeId whenever user types manually
    dosageGroup.get('routeId')?.setValue(null);

    if (value && value.length > 1) {
      this.autoComplete.routeSearch(value).subscribe(data => {
        this.routeUnit = data;
        if (!data || data.length === 0) {
          dosageGroup.get('routeId')?.setErrors({ notFound: true });
        } else {
          dosageGroup.get('routeId')?.setErrors(null); // clear error while typing
        }
      });
    } else {
      this.routeUnit = [];
      dosageGroup.get('routeId')?.setValue(null);
      dosageGroup.get('routeName')?.setValue('');
    }
  }

  selectRoute(route: Route, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    dosageGroup.get('routeId')?.setValue(route.conceptId);
    dosageGroup.get('routeName')?.setValue(route.conceptName);

    // Clear errors on selection
    dosageGroup.get('routeId')?.setErrors(null);

    this.routeUnit = [];
    this.skipRouteCodeFetch = true;
  }

  getRouteControl(stepIndex: number, medIndex: number, controlName: string): AbstractControl | null {
    const medsArray = this.getMedications(stepIndex);
    if (!medsArray) return null;

    const medGroup = medsArray.at(medIndex) as FormGroup;
    if (!medGroup) return null;

    const dosageGroup = medGroup.get('dosage') as FormGroup;
    if (!dosageGroup) return null;

    return dosageGroup.get(controlName);
  }

  currentRouteName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    return dosageGroup.get('routeName')?.value || '';
  }

  // subscribeRouteValueChanges(stepIndex: number) {
  //   this.routeSubscriptions.forEach(s => s.unsubscribe());
  //   this.routeSubscriptions = [];

  //   const medsArray = this.getMedications(stepIndex);

  //   medsArray.controls.forEach(medGroup => {
  //     const control = medGroup.get('dosage.routeName');
  //     if (!control) return;

  //     const sub = control.valueChanges.pipe(
  //       debounceTime(200),
  //       switchMap(term => {
  //         if (!term || term.length < 2 || this.skipRouteCodeFetch) {
  //           this.skipRouteCodeFetch = false;
  //           return of([]);
  //         }
  //         return this.autoComplete.routeSearch(term);
  //       })
  //     ).subscribe(data => this.routeUnit = data);

  //     this.routeSubscriptions.push(sub);
  //   });
  // }
  // onRouteInput(event: Event, stepIndex: number, medIndex: number) {
  //   const value = (event.target as HTMLInputElement).value;
  //   const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
  //   const dosageGroup = medGroup.get('dosage') as FormGroup;

  //   if (value && value.length > 1) {
  //     this.autoComplete.routeSearch(value).subscribe(data => this.routeUnit = data);
  //   } else {
  //     this.routeUnit = [];
  //     dosageGroup.get('routeId')?.setValue(null);
  //     dosageGroup.get('routeName')?.setValue('');
  //   }
  // }

  // selectRoute(route: Route, stepIndex: number, medIndex: number) {
  //   const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
  //   const dosageGroup = medGroup.get('dosage') as FormGroup;

  //   dosageGroup.get('routeId')?.setValue(route.conceptId);
  //   dosageGroup.get('routeName')?.setValue(route.conceptName);

  //   this.routeUnit = [];
  //   this.skipRouteCodeFetch = true;
  // }


  // currentRouteName(stepIndex: number, medIndex: number): string {
  //   const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
  //   const dosageGroup = medGroup.get('dosage') as FormGroup;

  //   return dosageGroup.get('routeName')?.value || '';
  // }

  submit() {
    if (this.superPrescription.invalid) {
      this.superPrescription.markAllAsTouched();

      alert("Please fill all required fields.");
      return;
    }

    const raw = this.superPrescription.value;

    const payload: SuperPrescriptionData = {
      doctorName: raw.doctorName,
      prescriptionDate: raw.prescriptionDate,
      notes: raw.notes,

      prescriptions: raw.prescription.map((pres: any) => ({
        conditionName: pres.reason,

        notes: pres.notes,

        medications: pres.medications.map((med: any) => ({
          medicationId: med.medicationId,
          status: med.status,
          effectiveStartDate: med.effectiveStartDate,
          effectiveEndDate: med.effectiveEndDate,
          dosage: {
            amount: med.dosage.amount,
            amountUnitId: med.dosage.amountUnitId,
            routeId: med.dosage.routeId,

            instruction: med.dosage.instruction
          },

          timing: {
            frequency: med.timing.frequency,
            period: med.timing.period,
            periodUnit: med.timing.periodUnit,
            timeOfDay: med.timing.timeOfDay,
            whenCode: med.timing.whenCode
          }
        }))
      }))
    };


    this.medicationService.savePrescription(payload).subscribe({
      next: res => {
        console.log("Saved!", res);
        this.goBack();
      },
      error: err => console.error("Save failed", err)
    });
  }
}

