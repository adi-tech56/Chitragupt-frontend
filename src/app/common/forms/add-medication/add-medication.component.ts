import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, of, Subscription, switchMap } from 'rxjs';
import { Amount, Medicine, Route, SuperPrescriptionData } from 'src/app/core/Models/Medication';
import { AutoCompleteService } from 'src/app/core/Services/auto-complete.service';
import { MedicationService } from 'src/app/core/Services/medication-service';

@Component({
  selector: 'app-add-medication',
  templateUrl: './add-medication.component.html',
  styleUrls: ['./add-medication.component.css']
})
export class AddMedicationComponent implements OnInit, OnDestroy {

  superPrescription: FormGroup;
  currentStep = 0;

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
    private autoComplete: AutoCompleteService
  ) {
    this.superPrescription = this.fb.group({
      doctorName: ['', Validators.required],
      prescriptionDate: [new Date(), Validators.required],
      notes: [''],
      prescription: this.fb.array([this.createPrescriptionGroup()])
    });
  }

  ngOnInit(): void {
    this.http.get<any[]>('assets/when-code.json').subscribe(data => this.whenCode = data);
    this.http.get<any[]>('assets/period-unit.json').subscribe(data => this.periodUnit = data);

    this.subscribeReasonValueChanges(0);
    this.subscribeMedicineValueChanges(0);
    this.subscribeRouteValueChanges(0);
    this.subscribeAmountValueChanges(0);
  }

  ngOnDestroy(): void {
    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.medicineSubscriptions.forEach(s => s.unsubscribe());
  }

  // ---------------- Form Builders ----------------
  createPrescriptionGroup(): FormGroup {
    return this.fb.group({
      reason: ['', Validators.required],
      notes: [''],
      medications: this.fb.array([this.createMedicationGroup()])
    });
  }

  createMedicationGroup(): FormGroup {
    return this.fb.group({
      medicationId: [null, Validators.required],
      medicationName: [''],
      effectiveStartDate: [new Date(), Validators.required],
      effectiveEndDate: [new Date(), Validators.required],
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
  }

  removeMedication(presIndex: number, medIndex: number) {
    this.getMedications(presIndex).removeAt(medIndex);
    this.subscribeMedicineValueChanges(presIndex);
  }


  /** CONDITION AUTOCOMPLETE */
  subscribeReasonValueChanges(stepIndex: number) {
    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.reasonSubscriptions = [];

    const control = (this.prescriptions.at(stepIndex) as FormGroup).get('reason');
    if (!control) return;

    const sub = control.valueChanges.pipe(
      debounceTime(200),
      switchMap(text => {
        if (!text || text.length < 2 || this.skipConditionFetch) {
          this.skipConditionFetch = false;
          return of([]);
        }
        return this.autoComplete.conditionSearch(text);
      })
    ).subscribe(data => this.conditions = data);

    this.reasonSubscriptions.push(sub);
  }

  selectCondition(cond: any) {
    const group = this.prescriptions.at(this.currentStep) as FormGroup;
    group.get('reason')?.setValue(cond.name || cond);
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

    if (value && value.length > 1) {
      this.autoComplete.medicineSearch(value).subscribe(data => this.medicines = data);
    } else {
      this.medicines = [];
      medGroup.get('medicationId')?.setValue(null);
      medGroup.get('medicationName')?.setValue('');
    }
  }

  selectMedicine(med: Medicine, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;

    medGroup.get('medicationId')?.setValue(med.medicationId);
    medGroup.get('medicationName')?.setValue(med.brandName);

    this.medicines = [];
    this.skipMedicineFetch = true;
  }

  currentMedicineName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    return medGroup.get('medicationName')?.value || '';
  }

  /**AMOUNT AUTOCOMPLETE */
  subscribeAmountValueChanges(stepIndex: number) {
    this.amountSubscriptions.forEach(s => s.unsubscribe());
    this.amountSubscriptions = [];

    const medsArray = this.getMedications(stepIndex);

    medsArray.controls.forEach(medGroup => {
      const control = medGroup.get('dosage.amountUnitName');
      if (!control) return;

      const sub = control.valueChanges.pipe(
        debounceTime(200),
        switchMap(term => {
          if (!term || term.length < 2 || this.skipAmountCodeFetch) {
            this.skipAmountCodeFetch = false;
            return of([]);
          }
          return this.autoComplete.amountSearch(term); // <=== CALL API
        })
      ).subscribe(data => this.amountUnit = data);

      this.amountSubscriptions.push(sub);
    });
  }
  onAmountUnitInput(event: Event, stepIndex: number, medIndex: number) {
    const value = (event.target as HTMLInputElement).value;
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    if (value && value.length > 1) {
      this.autoComplete.amountSearch(value).subscribe(data => this.amountUnit = data);
    } else {
      this.amountUnit = [];
      dosageGroup.get('amountUnitId')?.setValue(null);
      dosageGroup.get('amountUnitName')?.setValue('');
    }
  }

  selectAmountUnit(unit: Amount, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    dosageGroup.get('amountUnitId')?.setValue(unit.conceptId);
    dosageGroup.get('amountUnitName')?.setValue(unit.conceptName);

    this.amountUnit = [];
    this.skipAmountCodeFetch = true;
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

    if (value && value.length > 1) {
      this.autoComplete.routeSearch(value).subscribe(data => this.routeUnit = data);
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

    this.routeUnit = [];
    this.skipRouteCodeFetch = true;
  }


  currentRouteName(stepIndex: number, medIndex: number): string {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    const dosageGroup = medGroup.get('dosage') as FormGroup;

    return dosageGroup.get('routeName')?.value || '';
  }

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

    console.log("FINAL PAYLOAD:", payload);

    this.medicationService.savePrescription(payload).subscribe({
      next: res =>{
        console.log("Saved!", res);
      } ,
      error: err => console.error("Save failed", err)
    });
  }
}

