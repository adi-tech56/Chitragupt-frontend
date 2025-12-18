import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { LocationService } from 'src/app/core/Services/PatientServices/locationService.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { ToastService } from 'src/app/core/Services/toast.service';

@Component({
  selector: 'app-patient-contact-details',
  templateUrl: './patient-contact-details.component.html',
  styleUrls: ['./patient-contact-details.component.css'],
})
export class PatientContactDetailsComponent implements OnInit, OnDestroy {
  @Output() contactSubmitted = new EventEmitter<void>();
  currentStep = 1;
  maxStep = 3;

  contactForm: FormGroup;

  relationshipTypes: any[] = [];

  cityData: Array<{
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }> = [];
  countries: string[] = [];
  statesList: string[] = [];
  citiesList: string[] = [];

  filteredCountries: string[][] = [];
  filteredStates: string[][] = [];
  filteredCities: string[][] = [];

  showCountry: boolean[] = [];
  showState: boolean[] = [];
  showCity: boolean[] = [];

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private locationService: LocationService, // optional, still available if used elsewhere
    private patientContactService: PatientContactService,
    private auth: AuthService,
    private toaster: ToastService
  ) {
    this.contactForm = this.fb.group({
      relationshipType: ['', Validators.required],
      contactAddresses: this.fb.array([this.createAddressGroup()]),
      contactTelecoms: this.fb.array([this.createFirstTelecomGroup()]),
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: [''],
    });
  }

  ngOnInit() {
    this.http
      .get<any[]>('assets/data/relations-type.json')
      .subscribe((data) => (this.relationshipTypes = data || []));

    this.http
      .get<any[]>('assets/data/india-locations.json')
      .subscribe((list) => {
        this.cityData = list || [];

        this.citiesList = Array.from(
          new Set(this.cityData.map((x) => x.city))
        ).sort();
        this.statesList = Array.from(
          new Set(this.cityData.map((x) => x.state))
        ).sort();
        this.countries = Array.from(
          new Set(this.cityData.map((x) => x.country))
        ).sort();

        this.filteredCities[0] = this.citiesList.slice(0, 200);
        this.filteredStates[0] = this.statesList.slice(0, 200);
        this.filteredCountries[0] = this.countries.slice(0, 200);
      });

    this.showCountry[0] = false;
    this.showState[0] = false;
    this.showCity[0] = false;

    this.setupAddressAutocomplete(0);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  createAddressGroup(): FormGroup {
    return this.fb.group({
      useCode: ['', Validators.required],
      addressType: ['', Validators.required],
      text: ['', Validators.required],
      line1: [''],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
    });
  }

  createFirstTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['email', Validators.required], // default email
      useCode: [''],
      value: ['', [Validators.required, Validators.email]],
    });
  }

  phoneValidator(control: any) {
    const value = control.value;

    if (!value) return null;

    // Must be 10 digits
    if (!/^[0-9]{10}$/.test(value)) {
      return { invalidPhone: true };
    }

    // Reject numbers like 0000000000, 1111111111, ...
    if (/^(\d)\1{9}$/.test(value)) {
      return { sameDigit: true };
    }

    return null;
  }

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: [''],
      value: ['',[Validators.required, this.phoneValidator]],
    });
  }

  get contactAddresses(): FormArray {
    return this.contactForm.get('contactAddresses') as FormArray;
  }

  get contactTelecoms(): FormArray {
    return this.contactForm.get('contactTelecoms') as FormArray;
  }

  addAddress() {
    this.contactAddresses.push(this.createAddressGroup());
    const idx = this.contactAddresses.length - 1;

    this.filteredCountries[idx] = this.countries.slice(0, 200);
    this.filteredStates[idx] = this.statesList.slice(0, 200);
    this.filteredCities[idx] = this.citiesList.slice(0, 200);

    this.showCountry[idx] = false;
    this.showState[idx] = false;
    this.showCity[idx] = false;

    this.setupAddressAutocomplete(idx);
  }

  removeAddress(index: number) {
    if (this.contactAddresses.length > 1) {
      this.contactAddresses.removeAt(index);
      this.filteredCountries.splice(index, 1);
      this.filteredStates.splice(index, 1);
      this.filteredCities.splice(index, 1);
      this.showCountry.splice(index, 1);
      this.showState.splice(index, 1);
      this.showCity.splice(index, 1);
    }
  }

  addTelecom() {
    this.contactTelecoms.push(this.createTelecomGroup());
  }

  removeTelecom(index: number) {
    if (this.contactTelecoms.length > 1) this.contactTelecoms.removeAt(index);
  }

  setupAddressAutocomplete(index: number) {
    this.filteredCountries[index] =
      this.filteredCountries[index] || this.countries.slice(0, 200);
    this.filteredStates[index] =
      this.filteredStates[index] || this.statesList.slice(0, 200);
    this.filteredCities[index] =
      this.filteredCities[index] || this.citiesList.slice(0, 200);

    this.showCountry[index] = this.showCountry[index] ?? false;
    this.showState[index] = this.showState[index] ?? false;
    this.showCity[index] = this.showCity[index] ?? false;

    const group = this.contactAddresses.at(index) as FormGroup;

    const subC = group
      .get('country')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredCountries[index] = this.filterOptions(this.countries, val);
      });
    this.subs.push(subC);

    const subS = group
      .get('state')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredStates[index] = this.filterOptions(this.statesList, val);
      });
    this.subs.push(subS);

    const subCity = group
      .get('city')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredCities[index] = this.filterOptions(this.citiesList, val);
      });
    this.subs.push(subCity);
  }

  private filterOptions(list: string[], value: any): string[] {
    const q = (value || '').toString().toLowerCase().trim();
    if (!q) return list.slice(0, 200);
    return list.filter((x) => x.toLowerCase().includes(q)).slice(0, 200);
  }

  selectCountry(i: number, value: string) {
    this.contactAddresses.at(i).get('country')?.setValue(value);
    this.showCountry[i] = false;
  }

  selectState(i: number, value: string) {
    this.contactAddresses.at(i).get('state')?.setValue(value);
    this.showState[i] = false;
  }

  selectCity(i: number, city: string) {
    const group = this.contactAddresses.at(i) as FormGroup;
    group.get('city')?.setValue(city);

    const found = this.cityData.find(
      (c) => c.city.toLowerCase() === city.toLowerCase()
    );
    if (found) {
      group.get('state')?.setValue(found.state);
      group.get('country')?.setValue(found.country);
      group.get('postalCode')?.setValue(found.postalCode);
    }

    this.showCity[i] = false;
  }

  hideDropdownLater(i: number, type: 'city' | 'state' | 'country') {
    setTimeout(() => {
      if (type === 'city') this.showCity[i] = false;
      if (type === 'state') this.showState[i] = false;
      if (type === 'country') this.showCountry[i] = false;
    }, 180);
  }
nextStep() {
  const currentStepControls = this.getStepControls(this.currentStep);

  if (currentStepControls.invalid) {
    currentStepControls.markAllAsTouched();
    return;
  }

  // reset touched state of NEXT step before showing it
  const nextControls = this.getStepControls(this.currentStep + 1);
  if (nextControls) {
    this.resetControlState(nextControls);
  }

  this.currentStep++;
}

  getStepControls(step: number): AbstractControl {
    switch (step) {
      case 1:
        return this.fb.group({
          firstName: this.contactForm.get('firstName')!,
          relationshipType: this.contactForm.get('relationshipType')!,
        });

      case 2:
        return this.contactForm.get('contactAddresses')!;

      case 3:
        return this.contactForm.get('contactTelecoms')!;

      default:
        return this.contactForm;
    }
  }
private resetControlState(control: AbstractControl) {
  control.markAsUntouched();
  control.markAsPristine();

  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach(c =>
      this.resetControlState(c)
    );
  }
}
previousStep() {
  if (this.currentStep > 1) {
    this.currentStep--;

    const controls = this.getStepControls(this.currentStep);
    this.resetControlState(controls);
  }
}

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const patientId = this.auth.getUserId();

    const payload = {
      ...this.contactForm.value,
      patientId: patientId,
    };

    this.patientContactService.saveContact(payload).subscribe({
      next: (res) => {
        this.toaster.show('Emergency contact saved successfully!', 'success');
        localStorage.setItem('contactCompleted', 'true');
        this.contactSubmitted.emit();
      },
      error: (err) => {
        console.error(err);
        this.toaster.show('Something went wrong. Try again.', 'error');
      },
    });
  }
}
