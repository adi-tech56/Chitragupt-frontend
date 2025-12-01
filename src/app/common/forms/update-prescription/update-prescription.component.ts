import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { debounceTime, of, Subscription, switchMap } from 'rxjs';
import { MedicationService } from '../../../core/Services/PrescriptionServices/medication-service';
import { AutoCompleteService } from '../../../core/Services/PrescriptionServices/auto-complete.service';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { PrescriptionResponse } from 'src/app/core/Models/Medication';

@Component({
  selector: 'app-update-prescription',
  templateUrl: './update-prescription.component.html',
  styleUrls: ['./update-prescription.component.css']
})
export class UpdatePrescriptionComponent implements OnInit, OnDestroy {

  superPrescription: FormGroup;
  currentStep = 0;

  // Received object from previous page
  receivedData: any;

  // Autocomplete lists
  conditions: any[] = [];
  medicines: any[] = [];
  whenCode: any[] = [];
  periodUnit: any[] = [];
  amountUnit: any[] = [];
  routeUnit: any[] = [];

  // Skip flags
  private skipConditionFetch = false;
  private skipMedicineFetch = false;
  private skipAmountCodeFetch = false;
  private skipRouteCodeFetch = false;

  // Subscriptions
  private reasonSubscriptions: Subscription[] = [];
  private medicineSubscriptions: Subscription[] = [];
  private amountSubscriptions: Subscription[] = [];
  private routeSubscriptions: Subscription[] = [];
  medication: any;
  constructor(
    private fb: FormBuilder,
    private medicationService: MedicationService,
    private http: HttpClient,
    private autoComplete: AutoCompleteService,
    private location: Location,
    private router: Router
  ) {
    // Retrieve object passed through router
    // const nav = this.router.getCurrentNavigation();
    // this.receivedData = nav?.extras.state?.['medication'];
    // console.log(" RECEIVED UPDATE OBJECT:", this.receivedData);

    // Build empty form
    this.superPrescription = this.fb.group({

      doctorName: ['', Validators.required],
      prescriptionDate: [new Date(), Validators.required],
      notes: [''],
      prescription: this.fb.array([])
    });
  }

  goBack() {
    this.location.back();
  }
// openIndex: number | null = null;

// toggleAccordion(index: number) {
//   if (this.openIndex === index) {
//     this.openIndex = null;
//   } else {
//     this.openIndex = index;
//   }
// }
openIndex: number | null = null;

// Toggle function for existing accordions
toggleAccordion(index: number) {
  this.openIndex = this.openIndex === index ? null : index;
}

  ngOnInit(): void {
    // Load JSON files
    this.http.get<any[]>('assets/when-code.json').subscribe(data => this.whenCode = data);
    this.http.get<any[]>('assets/period-unit.json').subscribe(data => this.periodUnit = data);

     const medData = sessionStorage.getItem('medication');

  if (medData) {
    this.receivedData = JSON.parse(medData);
    console.log("Received medication:", this.receivedData);

    // Clear it so it doesn't persist unnecessarily
    sessionStorage.removeItem('medication');
  } else {
    console.warn("No medication data received. Possibly a direct reload.");
  }
  
    // Auto-fill the form if data exists
    if (this.receivedData) {
      this.patchFormWithReceivedData();
    }
  }

  ngOnDestroy(): void {
    this.reasonSubscriptions.forEach(s => s.unsubscribe());
    this.medicineSubscriptions.forEach(s => s.unsubscribe());
  }

  // ---------------- FORM GROUP BUILDERS ----------------

  createPrescriptionGroup(): FormGroup {
    return this.fb.group({
      reason: ['', Validators.required],
      notes: [''],
      medications: this.fb.array([this.createMedicationGroup()])
    });
  }

  createMedicationGroup(isExisting: boolean = false): FormGroup {
    return this.fb.group({
      medicationId: [null, Validators.required],
      medicationName: [''],
      effectiveStartDate: [new Date(), Validators.required],
      effectiveEndDate: [new Date(), Validators.required],
      status: ['ACTIVE', Validators.required],
      isExisting: [isExisting],
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

  // ---------------- GETTERS ----------------

  formatDateToInput(dateString: string | null): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // months are 0-based
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  get prescriptions(): FormArray {
    return this.superPrescription.get('prescription') as FormArray;
  }

  getMedications(presIndex: number): FormArray {
    return this.prescriptions.at(presIndex).get('medications') as FormArray;
  }

  get currentPrescriptionGroup(): FormGroup {
    return this.prescriptions.at(this.currentStep) as FormGroup;
  }

  // ---------------- PATCH UPDATE VALUES ----------------

  patchFormWithReceivedData() {
    const data = this.receivedData;

    // Top level fields
    this.superPrescription.patchValue({

      doctorName: data.doctorName,
      prescriptionDate: this.formatDateToInput(data.prescriptionDate),
      notes: data.notes
    });

    // Clear old prescriptions
    this.prescriptions.clear();

    // Loop through prescriptions
    data.prescriptions.forEach((pres: any) => {
      const presGroup = this.createPrescriptionGroup();

      presGroup.patchValue({
        reason: pres.conditionName,
        notes: pres.notes
      });

      const medsArray = presGroup.get('medications') as FormArray;
      medsArray.clear();

      // Loop medications
      pres.medications.forEach((med: any) => {
        const medGroup = this.createMedicationGroup();

        medGroup.patchValue({
          medicationId: med.medicationId,
          medicationName: med.medication,
          effectiveStartDate: this.formatDateToInput(med.effectiveStartDate),
          effectiveEndDate: this.formatDateToInput(med.effectiveEndDate),
          status: med.status,
          isExisting: true,
          dosage: {
            amount: med.dosage?.amount,
            amountUnitId: med.dosage?.amountUnitId,
            amountUnitName: med.dosage?.amountUnit,
            routeId: med.dosage?.routeId,
            routeName: med.dosage?.route,
            instruction: med.dosage?.instruction
          },

          timing: {
            frequency: med.timing?.frequency,
            period: med.timing?.period,
            periodUnit: med.timing?.periodUnit,
            timeOfDay: med.timing?.timeOfDay,
            whenCode: med.timing?.whenCode
          }
        });

        medsArray.push(medGroup);
      });

      this.prescriptions.push(presGroup);
    });

    // Reset step
    this.currentStep = 0;

    // Start autocomplete after form is filled
    this.subscribeReasonValueChanges(0);
    this.subscribeMedicineValueChanges(0);
    this.subscribeRouteValueChanges(0);
    this.subscribeAmountValueChanges(0);
  }

  // ---------------- NAVIGATION ----------------

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
  }

  removePrescription(index: number) {
    this.prescriptions.removeAt(index);

    if (this.currentStep >= this.prescriptions.length) {
      this.currentStep = this.prescriptions.length - 1;
    }
  }

  // addMedication(presIndex: number) {
  //   this.getMedications(presIndex).push(this.createMedicationGroup());
  // }
addMedication(presIndex: number) {
  const medsArray = this.getMedications(presIndex);
  medsArray.push(this.createMedicationGroup());

  // Open the newly added medication accordion
  this.openIndex = medsArray.length - 1;
}
  removeMedication(presIndex: number, medIndex: number) {
    this.getMedications(presIndex).removeAt(medIndex);
  }

  // ---------------- SUBSCRIPTION METHODS ----------------
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
    this.currentPrescriptionGroup.get('reason')?.setValue(cond.name || cond);
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

  selectMedicine(med: any, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    medGroup.patchValue({
      medicationId: med.medicationId,
      medicationName: med.brandName
    });
    this.medicines = [];
    this.skipMedicineFetch = true;
  }

  /** AMOUNT AUTOCOMPLETE */
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
          return this.autoComplete.amountSearch(term);
        })
      ).subscribe(data => this.amountUnit = data);

      this.amountSubscriptions.push(sub);
    });
  }

  selectAmountUnit(unit: any, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    medGroup.get('dosage')?.patchValue({
      amountUnitId: unit.conceptId,
      amountUnitName: unit.conceptName
    });

    this.amountUnit = [];
    this.skipAmountCodeFetch = true;
  }

  /** ROUTE AUTOCOMPLETE */
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

  selectRoute(route: any, stepIndex: number, medIndex: number) {
    const medGroup = this.getMedications(stepIndex).at(medIndex) as FormGroup;
    medGroup.get('dosage')?.patchValue({
      routeId: route.conceptId,
      routeName: route.conceptName
    });

    this.routeUnit = [];
    this.skipRouteCodeFetch = true;
  }

  // ---------------- SUBMIT ----------------

  submit() {
    if (this.superPrescription.invalid) {
      this.superPrescription.markAllAsTouched();

      // Get all invalid controls
      const invalidFields = Object.keys(this.superPrescription.controls)
        .filter(key => this.superPrescription.controls[key].invalid);

      alert("Please fill all required fields: " + invalidFields.join(', '));

      return;
    }

    const data = this.receivedData; // original received data
    const raw = this.superPrescription.value; // form values

    function formatTimeToBackend(time: string | null): string | null {
      if (!time) return null;
      const t = new Date(`1970-01-01T${time}`);
      const hh = ('0' + t.getHours()).slice(-2);
      const mm = ('0' + t.getMinutes()).slice(-2);
      const ss = ('0' + t.getSeconds()).slice(-2);
      return `${hh}:${mm}:${ss}`;
    }
    const payload: PrescriptionResponse = {
      ...data, // include all original top-level fields
      doctorName: raw.doctorName,
      prescriptionDate: raw.prescriptionDate,
      notes: raw.notes,

      prescriptions: raw.prescription.map((pres: any, presIndex: number) => ({
        ...data.prescriptions?.[presIndex], // preserve any original fields
        conditionName: pres.reason,
        notes: pres.notes,

        medications: pres.medications.map((med: any, medIndex: number) => ({
          ...data.prescriptions?.[presIndex]?.medications?.[medIndex], // preserve original medication fields
          medicationId: med.medicationId,
          medication: med.medicationName,
          status: med.status,
          effectiveStartDate: med.effectiveStartDate, // consider formatting to YYYY-MM-DD if using <input type="date">
          effectiveEndDate: med.effectiveEndDate,
          dosage: {
            ...data.prescriptions?.[presIndex]?.medications?.[medIndex].dosage, // overwrite with form values
            amount: med.dosage.amount,
            amountUnitId: med.dosage.amountUnitId,
            amountUnit: med.dosage.amountUnitName,
            instruction: med.dosage.instruction,
            routeId: med.dosage.routeId,
            route: med.dosage.routeName
          },
          timing: {
            ...data.prescriptions?.[presIndex]?.medications?.[medIndex].timing, // overwrite with form values
            frequency: med.timing.frequency,
            period: med.timing.period,
            periodUnit: med.timing.periodUnit,
            timeOfDay: formatTimeToBackend(med.timing.timeOfDay),
            whenCode: med.timing.whenCode
          }
        }))
      }))
    };

    console.log(payload);


    console.log(payload);

    console.log("🚀 FINAL UPDATE PAYLOAD:", payload);

    this.medicationService.updatePrescriptions(data.superPrescriptionId, payload).subscribe({
      next: res => {
        console.log("Saved!", res);
        this.goBack();
      },
      error: err => console.error("Save failed", err)
    });
  }
}
