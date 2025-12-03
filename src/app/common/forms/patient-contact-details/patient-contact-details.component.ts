import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { LocationService } from 'src/app/core/Services/PatientServices/locationService.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';

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
    private auth: AuthService
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

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: [''],
      value: ['', Validators.required],
    });
  }

  get addresses(): FormArray {
    return this.contactForm.get('addresses') as FormArray;
  }

  get telecoms(): FormArray {
    return this.contactForm.get('telecoms') as FormArray;
  }

  addAddress() {
    this.addresses.push(this.createAddressGroup());
    const idx = this.addresses.length - 1;

    this.filteredCountries[idx] = this.countries.slice(0, 200);
    this.filteredStates[idx] = this.statesList.slice(0, 200);
    this.filteredCities[idx] = this.citiesList.slice(0, 200);

    this.showCountry[idx] = false;
    this.showState[idx] = false;
    this.showCity[idx] = false;

    this.setupAddressAutocomplete(idx);
  }

  removeAddress(index: number) {
    if (this.addresses.length > 1) {
      this.addresses.removeAt(index);
      this.filteredCountries.splice(index, 1);
      this.filteredStates.splice(index, 1);
      this.filteredCities.splice(index, 1);
      this.showCountry.splice(index, 1);
      this.showState.splice(index, 1);
      this.showCity.splice(index, 1);
    }
  }

  addTelecom() {
    this.telecoms.push(this.createTelecomGroup());
  }

  removeTelecom(index: number) {
    if (this.telecoms.length > 1) this.telecoms.removeAt(index);
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

    const group = this.addresses.at(index) as FormGroup;

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
    this.addresses.at(i).get('country')?.setValue(value);
    this.showCountry[i] = false;
  }

  selectState(i: number, value: string) {
    this.addresses.at(i).get('state')?.setValue(value);
    this.showState[i] = false;
  }

  selectCity(i: number, city: string) {
    const group = this.addresses.at(i) as FormGroup;
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
    if (this.currentStep < this.maxStep) this.currentStep++;
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
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
        alert('Contact saved successfully!');
        localStorage.setItem('contactCompleted', 'true');
        this.contactSubmitted.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to save contact');
      },
    });
  }
}
