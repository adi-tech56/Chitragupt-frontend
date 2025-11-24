import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, Subscription, switchMap } from 'rxjs';
import { Medicine, Route } from 'src/app/core/Models/Medication';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { MedicineService } from 'src/app/core/Services/AutoCompleteServices/medicine-service';
import { RouteService } from 'src/app/core/Services/AutoCompleteServices/route-service';
import { LocationService } from 'src/app/core/Services/locationService.service';
import { PatientContactService } from 'src/app/core/Services/patient-contact.service';



@Component({
  selector: 'app-patient-contact-details',
  templateUrl: './patient-contact-details.component.html',
  styleUrls: ['./patient-contact-details.component.css']
})
export class PatientContactDetailsComponent implements OnInit {
  @Output() contactSubmitted = new EventEmitter<void>();
  currentStep = 1;
  maxStep = 3;

  contactForm: FormGroup;

  relationshipTypes: any[] = [];
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
    private routeService:RouteService,
    private locationService : LocationService,
    private patientContactService: PatientContactService,
    private auth:AuthService

  ) {
    this.contactForm = this.fb.group({
      relationshipType: ['', Validators.required],
      addresses: this.fb.array([this.createAddressGroup()]),
      telecoms: this.fb.array([this.createTelecomGroup()]),
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: [''],

    });
  }

  ngOnInit() {

    this.http.get<any[]>('assets/relations-type.json')
      .subscribe(data => {
        this.relationshipTypes = data;
      });
      this.locationService.getCountries().subscribe(list => {
      this.countries = list || [];

      if (!this.filteredCountries[0]) this.filteredCountries[0] = this.countries.slice(0, 200);
    });
    this.locationService.getStates().subscribe(list => {
      this.statesList = list || [];
      if (!this.filteredStates[0]) this.filteredStates[0] = this.statesList.slice(0, 200);
    });
    this.locationService.getCities().subscribe(list => {
      this.citiesList = list || [];
      if (!this.filteredCities[0]) this.filteredCities[0] = this.citiesList.slice(0, 200);
    });


    this.showCountry[0] = false;
    this.showState[0] = false;
    this.showCity[0] = false;

    // setup listeners for row 0
    this.setupAddressAutocomplete(0);

  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  createAddressGroup(): FormGroup {
    return this.fb.group({
      addressUse: ['', Validators.required],
      addressType: ['', Validators.required],
      addressText: ['', Validators.required],
      line: [''],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required]
    });
  }

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: ['', Validators.required],
      value: ['', Validators.required]
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
      // remove formgroup
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
    // ensure filtered arrays exist
    this.filteredCountries[index] = this.filteredCountries[index] || this.countries.slice(0, 200);
    this.filteredStates[index] = this.filteredStates[index] || this.statesList.slice(0, 200);
    this.filteredCities[index] = this.filteredCities[index] || this.citiesList.slice(0, 200);

    // ensure show flags exist
    this.showCountry[index] = this.showCountry[index] ?? false;
    this.showState[index] = this.showState[index] ?? false;
    this.showCity[index] = this.showCity[index] ?? false;

    const group = this.addresses.at(index) as FormGroup;

    // country value changes
    const subC = group.get('country')!.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(val => {
        this.filteredCountries[index] = this.filterOptions(this.countries, val);
      });
    this.subs.push(subC);

    // state value changes
    const subS = group.get('state')!.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(val => {
        this.filteredStates[index] = this.filterOptions(this.statesList, val);
      });
    this.subs.push(subS);

    // city value changes
    const subCity = group.get('city')!.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(val => {
        this.filteredCities[index] = this.filterOptions(this.citiesList, val);
      });
    this.subs.push(subCity);
  }

  private filterOptions(list: string[], value: any): string[] {
    const q = (value || '').toString().toLowerCase().trim();
    if (!q) return list.slice(0, 200); // limit initial results for performance
    return list.filter(x => x.toLowerCase().includes(q)).slice(0, 200);
  }

  /* ----------------- Dropdown helpers ----------------- */
  selectCountry(i: number, value: string) {
    this.addresses.at(i).get('country')?.setValue(value);
    this.showCountry[i] = false;
  }
  selectState(i: number, value: string) {
    this.addresses.at(i).get('state')?.setValue(value);
    this.showState[i] = false;
  }
  selectCity(i: number, value: string) {
    this.addresses.at(i).get('city')?.setValue(value);
    this.showCity[i] = false;
  }

  hideDropdownLater(i: number, type: 'city'|'state'|'country') {
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

  const patientId =this.auth.getUserId();

  const payload = {
    ...this.contactForm.value,
    patientId: patientId
  };

  this.patientContactService.saveContact(payload).subscribe({
    next: res => {
      alert("Contact saved successfully!");

      localStorage.setItem("contactCompleted", "true");

      this.contactSubmitted.emit();
    },
    error: err => {
      console.error(err);
      alert("Failed to save contact");
    }
  });
}
}


