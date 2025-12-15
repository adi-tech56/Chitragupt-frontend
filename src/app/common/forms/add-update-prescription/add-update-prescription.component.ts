import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Route } from '@angular/router';
import { debounceTime, of, Subscription, switchMap } from 'rxjs';
import { Amount, Medicine, PrescriptionResponse, SuperPrescriptionData } from 'src/app/core/Models/Medication';
import { AutoCompleteService } from 'src/app/core/Services/PrescriptionServices/auto-complete.service';
import { DailyMedicationService } from 'src/app/core/Services/PrescriptionServices/daily-medication.service';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { Location } from '@angular/common';
import { Routes } from 'src/app/core/Models/Medication';
import { ToastService } from 'src/app/core/Services/toast.service';
export type PrescriptionMode = 'add' | 'update';
function dateValidator(control: AbstractControl) {
  const value = control.value;
  if (!value) return null; // required is handled separately
  const date = new Date(value);
  return isNaN(date.getTime()) ? { invalidDate: true } : null;
}
function conditionSelectedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const reasonValid = control.parent?.get('reasonValid')?.value;
    const touched = control.touched;

    if (touched && !reasonValid) {
      return { conditionInvalid: true };
    }
    return null;
  };
}

function medicineSelectedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const parent = control.parent;
    if (!parent) return null;

    const medId = parent.get('medicationId')?.value;

    return medId ? null : { medicineInvalid: true };
  };
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
function noFutureDateValidator() {
  return (control: AbstractControl) => {
    if (!control.value) return null;

    const selected = new Date(control.value);
    const today = new Date();

    return selected > today ? { maxDate: true } : null;
  };
}

@Component({
  selector: 'app-add-update-prescription',
  templateUrl: './add-update-prescription.component.html',
  styleUrls: ['./add-update-prescription.component.css']
})

export class AddUpdatePrescriptionComponent implements OnInit, OnDestroy {

  mode: PrescriptionMode = 'add';
  prescriptionId: string | null = null;
  receivedData: any | null = null;

  superPrescription: FormGroup;
  currentStep = 0;
  timingDescriptions: string[][] = [];
today = new Date().toISOString().split('T')[0];
  // for autocomplete
  conditions: any[] = [];
  medicines: any[] = [];
  whenCode: any[] = [];
  periodUnit: any[] = [];
  amountUnit: any[] = [];
  routeUnit: any[] = [];
  openIndex: number | null = null;
  isSubmitted = false;
  // Toggle function for existing accordions
  toggleAccordion(index: number) {
    this.openIndex = this.openIndex === index ? null : index;
  }
  private skipConditionFetch = false;
  private skipMedicineFetch = false;
  private skipAmountCodeFetch = false;
  private skipRouteCodeFetch = false;
  // for unsubscribing
  private reasonSubscriptions: Subscription[] = [];
  private medicineSubscriptions: Subscription[] = [];
  private amountSubscriptions: Subscription[] = [];
  private routeSubscriptions: Subscription[] = [];



  constructor(
    private fb: FormBuilder,
    private medicationService: MedicationService,
    private http: HttpClient,
    private autoComplete: AutoCompleteService,
    private route: ActivatedRoute,
    private location: Location,
    private dailyMeds: DailyMedicationService,
    private toast: ToastService,
  ) {
    this.superPrescription = this.fb.group({
      doctorName: ['', Validators.required],
      prescriptionDate: ['', [
        Validators.required,
        dateValidator,noFutureDateValidator,
        dateRangeValidator(new Date('1700-01-01'), new Date('2040-12-31'))
      ]],
      notes: [''],
      prescription: this.fb.array([])
    });
  }

  ngOnInit(): void {

    // load static json
    this.http.get<any[]>('assets/when-code.json').subscribe(d => this.whenCode = d);
    this.http.get<any[]>('assets/period-unit.json').subscribe(d => this.periodUnit = d);

    // detect mode from URL
    this.route.url.subscribe(url => {
      if (url.some(seg => seg.path === 'update')) {
        this.mode = 'update';
      } else {
        this.mode = 'add';
      }
    });

    // detect ID for update mode
    this.route.paramMap.subscribe(params => {
      this.prescriptionId = params.get('id');

      if (this.mode === 'update' && this.prescriptionId) {
        this.loadPrescription(this.prescriptionId);
      } else {
        this.initializeAddMode();
      }
    });


  }

  ngOnDestroy(): void {
    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.medicineSubscriptions.forEach(s => s.unsubscribe());
    this.amountSubscriptions.forEach(s => s.unsubscribe());
    this.routeSubscriptions.forEach(s => s.unsubscribe());
  }
  isRequired(controlPath: string | (string | number)[]): boolean {
    let control: AbstractControl | null;

    if (Array.isArray(controlPath)) {
      // Traverse the path step by step
      control = controlPath.reduce((c: AbstractControl | null, key: string | number) => {
        return c ? c.get(key.toString()) : null;
      }, this.superPrescription as AbstractControl | null);
    } else {
      control = this.superPrescription.get(controlPath);
    }

    if (!control || !control.validator) return false;

    const result = control.validator({} as AbstractControl);
    return !!(result && result['required']);
  }



  initializeAddMode() {
    this.prescriptions.push(this.createPrescriptionGroup());
    this.currentStep = this.prescriptions.length - 1;
    this.subscribeReasonValueChanges(this.currentStep);
    this.subscribeMedicineValueChanges(this.currentStep);
    this.initTimingDescriptions(this.currentStep);
    this.initAutocompleteForStep(0);
    this.initTimingDescriptions(0);
  }

  loadPrescription(id: string) {
    this.medicationService.getMedicationById(id).subscribe({
      next: data => {
        this.receivedData = data;
        console.log(this.receivedData)
        this.patchFormWithReceivedData();
      },
      error: err => console.error(err)
    });
  }
  formatDateForInput(dateStr: string | null): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const dd = ('0' + d.getDate()).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }

  patchFormWithReceivedData() {
    const data = this.receivedData;

    this.superPrescription.patchValue({
      doctorName: data.doctorName,
      prescriptionDate: data.prescriptionDate,
      notes: data.notes
    });

    // reset prescription array
    this.prescriptions.clear();

    data.prescriptions.forEach((pres: any) => {
      const group = this.createPrescriptionGroup();
      group.patchValue({
        reason: pres.conditionName,
        notes: pres.notes
      });
      group.get('reasonValid')?.setValue(true, { emitEvent: false });
      const medsArray = group.get('medications') as FormArray;
      medsArray.clear();

      pres.medications.forEach((med: any) => {
        const medGroup = this.createMedicationGroup(true);
        medGroup.patchValue({
          medicationId: med.medicationId,
          medicationName: med.medication,
          effectiveStartDate: this.formatDateForInput(med.effectiveStartDate),
          effectiveEndDate: this.formatDateForInput(med.effectiveEndDate),
          status: med.status,
          dosage: {
            amount: med.dosage.amount,
            amountUnitId: med.dosage.amountUnitId,
            amountUnitName: med.dosage.amountUnit,
            routeId: med.dosage.routeId,
            routeName: med.dosage.route,
            instruction: med.dosage.instruction
          },
          timing: {
            frequency: med.timing.frequency,
            period: med.timing.period,
            periodUnit: med.timing.periodUnit,
            timeOfDay: med.timing.timeOfDay,
            whenCode: med.timing.whenCode
          }
        });
        medsArray.push(medGroup);
      });

      this.prescriptions.push(group);
    });

    this.currentStep = 0;
    this.initAutocompleteForStep(0);
    this.initTimingDescriptions(0);
  }

  // ============= FORM GETTERS =================

  get prescriptions() {
    return this.superPrescription.get('prescription') as FormArray;
  }

createPrescriptionGroup(): FormGroup {
  const group = this.fb.group({
    reason: ['', [Validators.required, conditionSelectedValidator()]],
    reasonValid: [false],
    notes: [''],
    medications: this.fb.array([this.createMedicationGroup()])
  });
group.get('reason')!.valueChanges.subscribe(() => {
  const ctrl = group.get('reason')!;
  group.get('reasonValid')!.setValue(false, { emitEvent: false });
  if (!ctrl.touched) {
    ctrl.markAsTouched({ onlySelf: true });
  }
});
  return group;
 
}


  createMedicationGroup(isExisting: boolean = false): FormGroup {
    return this.fb.group({
      medicationId: [null, Validators.required],
      medicationName: ['', [Validators.required, medicineSelectedValidator()]],
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
      isExisting: [isExisting],
      dosage: this.fb.group({
        amount: [null, Validators.required],
        amountUnitName: ['', Validators.required],
        amountUnitId: [null, Validators.required],
        routeName: ['', Validators.required],
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

  initAutocompleteForStep(step: number) {
    this.subscribeReasonValueChanges(step);
    this.subscribeMedicineValueChanges(step);
    this.subscribeAmountValueChanges(step);
    this.subscribeRouteValueChanges(step);
  }

  // ============ TIMING DESCRIPTION ===============

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


  //Getters

  getMedications(presIndex: number): FormArray {
    return this.prescriptions.at(presIndex).get('medications') as FormArray;
  }
  get currentPrescriptionGroup(): FormGroup {
    return this.prescriptions.at(this.currentStep) as FormGroup;
  }
  // ---------------- Navigation ----------------
  nextStep() {
    const currentPrescription = this.prescriptions.at(this.currentStep);
    currentPrescription.markAllAsTouched();
    this.isSubmitted = true;
    if (currentPrescription.invalid) {
      this.toast.show('Please fill all required fields in the current prescription before moving to the next step.', 'error');

      return;
    }
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
    const currentPrescription = this.prescriptions.at(this.currentStep);
    this.isSubmitted = true;
    currentPrescription.markAllAsTouched();
    if (currentPrescription.invalid) {
      this.toast.show('Please fill all required fields in the current prescription before adding a new one.', 'error');

      return;
    }
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
  //ReasonValue
  subscribeReasonValueChanges(stepIndex: number) {

    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.reasonSubscriptions = [];

    const control = (this.prescriptions.at(stepIndex) as FormGroup).get('reason');
    if (!control) return;
    const sub = control.valueChanges.pipe(
      debounceTime(200),
      switchMap(text => {
        (this.prescriptions.at(stepIndex) as FormGroup).get('reasonValid')?.setValue(false, { emitEvent: false });
        if (!text || text.length < 1 || this.skipConditionFetch) {
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

    group.get('reasonValid')?.setValue(true, { emitEvent: false });

    const reasonControl = group.get('reason');
    if (reasonControl?.hasError('conditionInvalid')) {
      const errors = { ...reasonControl.errors };
      delete errors['conditionInvalid'];
      reasonControl.setErrors(Object.keys(errors).length ? errors : null);
    }

    this.conditions = [];
    this.skipConditionFetch = true;

    console.log('After selecting condition — reasonValid:', group.get('reasonValid')?.value);
    console.log('reason control errors:', reasonControl?.errors);
  }


  //Medicine
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


    // Trigger validation
    medGroup.get('medicationName')?.updateValueAndValidity();

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

    // Clear validator error
    medGroup.get('medicationName')?.setErrors(null);

    this.medicines = [];
    this.skipMedicineFetch = true;
  }


  currentMedicineName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    return medGroup.get('medicationName')?.value || '';
  }

  getMedicationControl(stepIndex: number, medIndex: number, controlName: string): AbstractControl | null {
    const medsArray = this.getMedications(stepIndex);
    if (!medsArray) return null;
    const medGroup = medsArray.at(medIndex) as FormGroup;
    if (!medGroup) return null;
    return medGroup.get(controlName);
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

  selectRoute(route: Routes, stepIndex: number, medIndex: number) {
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
  // ============= SUBMIT ===================

  submit() {
    this.isSubmitted = true;
    if (this.superPrescription.invalid) {
      this.superPrescription.markAllAsTouched();
      this.toast.show('Please fill all required fields.', 'error');
      // alert('Please fill all required fields.');
      return;
    }
    function formatTimeToBackend(time: string | null): string | null {
      if (!time) return null;
      const t = new Date(`1970-01-01T${time}`);
      const hh = ('0' + t.getHours()).slice(-2);
      const mm = ('0' + t.getMinutes()).slice(-2);
      const ss = ('0' + t.getSeconds()).slice(-2);
      return `${hh}:${mm}:${ss}`;
    }
    const raw = this.superPrescription.value;

    if (this.mode === 'add') {
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
              timeOfDay: formatTimeToBackend(med.timing.timeOfDay),
              whenCode: med.timing.whenCode
            }
          }))
        }))
      };


      this.medicationService.savePrescription(payload).subscribe({
        next: res => {
          console.log("Saved!", res);
          this.toast.show('Prescription Saved !', 'success');
          this.goBack();
          this.dailyMeds.refreshMeds();
        },
        error: err => {console.error("Save failed", err);
           this.toast.show('Adding Prescription Failed.', 'error');

        }
      });
    }

    if (this.mode === 'update' && this.prescriptionId) {

      const payload: PrescriptionResponse = {
        ...this.receivedData, // include all original top-level fields
        doctorName: raw.doctorName,
        prescriptionDate: raw.prescriptionDate,
        notes: raw.notes,

        prescriptions: raw.prescription.map((pres: any, presIndex: number) => ({
          ...this.receivedData.prescriptions?.[presIndex], // preserve any original fields
          conditionName: pres.reason,
          notes: pres.notes,

          medications: pres.medications.map((med: any, medIndex: number) => ({
            ...this.receivedData.prescriptions?.[presIndex]?.medications?.[medIndex], // preserve original medication fields
            medicationId: med.medicationId,
            medication: med.medicationName,
            status: med.status,
            effectiveStartDate: med.effectiveStartDate, // consider formatting to YYYY-MM-DD if using <input type="date">
            effectiveEndDate: med.effectiveEndDate,
            dosage: {
              ...this.receivedData.prescriptions?.[presIndex]?.medications?.[medIndex].dosage, // overwrite with form values
              amount: med.dosage.amount,
              amountUnitId: med.dosage.amountUnitId,
              amountUnit: med.dosage.amountUnitName,
              instruction: med.dosage.instruction,
              routeId: med.dosage.routeId,
              route: med.dosage.routeName
            },
            timing: {
              ...this.receivedData.prescriptions?.[presIndex]?.medications?.[medIndex].timing, // overwrite with form values
              frequency: med.timing.frequency,
              period: med.timing.period,
              periodUnit: med.timing.periodUnit,
              timeOfDay: formatTimeToBackend(med.timing.timeOfDay),
              whenCode: med.timing.whenCode
            }
          }))
        }))
      };

      this.medicationService.updatePrescriptions(this.receivedData.superPrescriptionId, payload).subscribe({
        next: res => {
          console.log("Saved!", res);
          this.toast.show('Prescription Updated !', 'success');
          this.goBack();
          this.dailyMeds.refreshMeds();
        },
        error: err => {console.error("Save failed", err);
           this.toast.show('Update Failed.', 'error');

        }
      });
    }
  }

  goBack() {
    this.location.back();
  }
}
