import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { LocationService } from 'src/app/core/Services/PatientServices/locationService.service';
import { Location } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.css'],
})
export class ContactPageComponent implements OnInit, OnDestroy {
  
  loading = false;
  contacts: any[] = [];
  firstLetter = '';

  isEditMode = false;
  editingId: number | null = null;

  // dropdowns & dataset
  relationshipOptions: string[] = [];
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

  // store one Subscription per address (composite subscription)
  private subs: Subscription[] = [];

  // reactive modal form (uses backend field names contactTelecoms/contactAddresses)
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contactService: PatientContactService,
    private locationService: LocationService,
    private http: HttpClient,
    private auth: AuthService,
    private location:Location
  ) {
    // build form with same shape as your backend expects
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      relationshipType: ['', Validators.required],
      patientId: [this.auth.getUserId()],
      contactTelecoms: this.fb.array([this.createTelecomGroup()]),
      contactAddresses: this.fb.array([this.createAddressGroup()]),
    });
  }
  goBack() {
    this.location.back();
  }
  ngOnInit(): void {
    this.loadContacts();
    const name = this.auth.getUserName();
    this.firstLetter = name ? name[0].toUpperCase() : '';

    // load relationship types (supports array of strings or objects with display/code)
    this.http.get<any[]>('assets/data/relations-type.json').subscribe(
      (data) => {
        if (!data) return;
        if (typeof data[0] === 'string')
          this.relationshipOptions = data as string[];
        else
          this.relationshipOptions = (data as any[]).map(
            (x) => x.display ?? x.code ?? x
          );
      },
      (err) => {
        console.warn('Failed to load relations-type.json', err);
      }
    );

    // load city/state/country dataset
    this.http.get<any[]>('assets/data/india-locations.json').subscribe(
      (list) => {
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

        // initialise filtered lists for first address
        this.filteredCities[0] = this.citiesList.slice(0, 200);
        this.filteredStates[0] = this.statesList.slice(0, 200);
        this.filteredCountries[0] = this.countries.slice(0, 200);
      },
      (err) => {
        console.warn('Failed to load india-locations.json', err);
      }
    );

    // ensure ui flags exist for index 0
    this.showCountry[0] = false;
    this.showState[0] = false;
    this.showCity[0] = false;

    // wire up autocomplete for first address index
    this.setupAddressAutocomplete(0);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s?.unsubscribe());
  }

  /** form group factories **/
  createAddressGroup(): FormGroup {
    return this.fb.group({
      id: [null], // preserve id for edits (backend expects id)
      useCode: ['', Validators.required],
      addressType: [''],
      text: [''],
      line1: [''],
      line2: [''],
      city: ['', Validators.required],
      district: [''],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
    });
  }

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      id: [null], // preserve id for edits
      system: ['phone', Validators.required],
      useCode: [''],
      value: ['', Validators.required],
    });
  }

  /** getters **/
  get contactTelecoms(): FormArray {
    return this.contactForm.get('contactTelecoms') as FormArray;
  }

  get contactAddresses(): FormArray {
    return this.contactForm.get('contactAddresses') as FormArray;
  }

  // alias names for template convenience
  get telecoms() {
    return this.contactTelecoms;
  }

  get addresses() {
    return this.contactAddresses;
  }

  /** add/remove **/
  addTelecom() {
    this.contactTelecoms.push(this.createTelecomGroup());
  }

  removeTelecom(index: number) {
    if (this.contactTelecoms.length > 1) this.contactTelecoms.removeAt(index);
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
      // unsubscribe and remove the composite subscription for this index
      const s = this.subs[index];
      if (s) {
        s.unsubscribe();
        this.subs.splice(index, 1);
      }

      this.contactAddresses.removeAt(index);
      this.filteredCountries.splice(index, 1);
      this.filteredStates.splice(index, 1);
      this.filteredCities.splice(index, 1);
      this.showCountry.splice(index, 1);
      this.showState.splice(index, 1);
      this.showCity.splice(index, 1);
    }
  }

  /**
   * Create valueChanges subscriptions for country/state/city of the address group.
   * Stores a composite Subscription per address index so we can cleanly unsubscribe later.
   */
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

    const composite = new Subscription();

    const subC = group
      .get('country')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredCountries[index] = this.filterOptions(this.countries, val);
      });
    composite.add(subC);

    const subS = group
      .get('state')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredStates[index] = this.filterOptions(this.statesList, val);
      });
    composite.add(subS);

    const subCity = group
      .get('city')!
      .valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((val) => {
        this.filteredCities[index] = this.filterOptions(this.citiesList, val);
      });
    composite.add(subCity);

    // put composite subscription in subs at correct index
    this.subs[index] = composite;
  }

  private filterOptions(list: string[], value: any): string[] {
    const q = (value || '').toString().toLowerCase().trim();
    if (!q) return list.slice(0, 200);
    return list.filter((x) => x.toLowerCase().includes(q)).slice(0, 200);
  }

  selectCountry(i: number, value: string) {
    const group = this.contactAddresses.at(i) as FormGroup;
    group.get('country')?.setValue(value);
    this.showCountry[i] = false;
  }

  selectState(i: number, value: string) {
    const group = this.contactAddresses.at(i) as FormGroup;
    group.get('state')?.setValue(value);
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

  /** Load contacts from backend */
  loadContacts() {
    this.loading = true;
    this.contactService.getContact().subscribe({
      next: (res: any) => {
        this.contacts = res?.contacts ?? [];
      },
      error: (err) => {
        console.error('Failed to load contacts', err);
      },
      complete: () => (this.loading = false),
    });
  }

  /** Open add modal */
  openAddModal() {
    this.isEditMode = false;
    this.editingId = null;

    // reset core fields
    this.contactForm.reset({
      firstName: '',
      middleName: '',
      lastName: '',
      relationshipType: '',
      patientId: this.auth.getUserId(),
    });

    // clear arrays and subscriptions
    while (this.contactTelecoms.length) this.contactTelecoms.removeAt(0);
    while (this.contactAddresses.length) this.contactAddresses.removeAt(0);
    this.subs.forEach((s) => s?.unsubscribe());
    this.subs = [];
    this.filteredCities = [];
    this.filteredStates = [];
    this.filteredCountries = [];
    this.showCity = [];
    this.showState = [];
    this.showCountry = [];

    // add defaults (with backend field names)
    this.addTelecom();
    this.addAddress();

    const modalEl = document.getElementById('editContactModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  /** Open edit modal and populate form (preserves ids) */
  openEditModal(contact: any) {
    this.isEditMode = true;
    this.editingId = contact.id ?? null;

    // patch main fields
    this.contactForm.patchValue({
      firstName: contact.firstName ?? '',
      middleName: contact.middleName ?? '',
      lastName: contact.lastName ?? '',
      relationshipType: contact.relationshipType ?? '',
      patientId: this.auth.getUserId(),
    });

    // clear arrays and subs
    while (this.contactTelecoms.length) this.contactTelecoms.removeAt(0);
    while (this.contactAddresses.length) this.contactAddresses.removeAt(0);
    this.subs.forEach((s) => s?.unsubscribe());
    this.subs = [];
    this.filteredCities = [];
    this.filteredStates = [];
    this.filteredCountries = [];
    this.showCity = [];
    this.showState = [];
    this.showCountry = [];

    // populate telecoms (preserve id & useCode)
    const telList =
      contact.contactTelecoms && contact.contactTelecoms.length
        ? contact.contactTelecoms
        : [{ id: null, system: 'phone', useCode: '', value: '' }];

    telList.forEach((t: any) => {
      this.contactTelecoms.push(
        this.fb.group({
          id: [t.id ?? null],
          system: [t.system ?? 'phone', Validators.required],
          useCode: [t.useCode ?? ''],
          value: [t.value ?? '', Validators.required],
        })
      );
    });

    // populate addresses (preserve id and backend field names)
    const addrList =
      contact.contactAddresses && contact.contactAddresses.length
        ? contact.contactAddresses
        : [
            {
              id: null,
              useCode: '',
              addressType: '',
              text: '',
              line1: '',
              line2: '',
              city: '',
              district: '',
              state: '',
              postalCode: '',
              country: '',
            },
          ];

    addrList.forEach((a: any, idx: number) => {
      this.contactAddresses.push(
        this.fb.group({
          id: [a.id ?? null],
          useCode: [a.useCode ?? '', Validators.required],
          addressType: [a.addressType ?? ''],
          text: [a.text ?? '', Validators.required],
          line1: [a.line1 ?? ''],
          line2: [a.line2 ?? ''],
          city: [a.city ?? '', Validators.required],
          district: [a.district ?? ''],
          state: [a.state ?? '', Validators.required],
          postalCode: [a.postalCode ?? '', Validators.required],
          country: [a.country ?? '', Validators.required],
        })
      );

      // init autocomplete helpers & attach subscription
      this.filteredCities[idx] = this.citiesList.slice(0, 200);
      this.filteredStates[idx] = this.statesList.slice(0, 200);
      this.filteredCountries[idx] = this.countries.slice(0, 200);
      this.showCity[idx] = false;
      this.showState[idx] = false;
      this.showCountry[idx] = false;
      this.setupAddressAutocomplete(idx);
    });

    const modalEl = document.getElementById('editContactModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  /**
   * Logs invalid fields recursively (handles FormGroups and FormArrays)
   */
  logInvalidFields(form: FormGroup | FormArray, parentKey: string = '') {
    if (!form) return;

    if (form instanceof FormArray) {
      form.controls.forEach((ctrl, idx) => {
        const key = `${parentKey}[${idx}]`;
        if (ctrl instanceof FormGroup || ctrl instanceof FormArray) {
          this.logInvalidFields(ctrl as any, key);
        } else if (ctrl && (ctrl as any).invalid) {
          console.warn(`❌ Invalid Field: ${key}`, (ctrl as any).errors);
        }
      });
      return;
    }

    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.logInvalidFields(control as any, fullKey);
      } else if (control?.invalid) {
        console.warn(`❌ Invalid Field: ${fullKey}`, control.errors);
      }
    });
  }

  /** Save (create or update) */
  saveModal() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      console.log('❌ Form is invalid. Below are the invalid fields:');
      this.logInvalidFields(this.contactForm);
      alert('Please fill required fields.');
      return;
    }

    // payload already matches backend dto keys
    const payload = {
      ...this.contactForm.value,
      patientId: this.auth.getUserId(),
    };

    if (this.isEditMode && this.editingId) {
      this.contactService.updateContact(this.editingId, payload).subscribe({
        next: (res) => {
          const idx = this.contacts.findIndex((c) => c.id === this.editingId);
          if (idx >= 0)
            this.contacts[idx] = res ?? { ...payload, id: this.editingId };
          (
            document.querySelector(
              '#editContactModal .btn-close'
            ) as HTMLElement
          )?.click();
        },
        error: (err) => {
          console.error('Failed to update contact', err);
          alert('Could not update contact.');
        },
      });
    } else {
      this.contactService.saveContact(payload).subscribe({
        next: (res) => {
          this.contacts.push(res ?? payload);
          (
            document.querySelector(
              '#editContactModal .btn-close'
            ) as HTMLElement
          )?.click();
        },
        error: (err) => {
          console.error('Failed to save contact', err);
          alert('Could not save contact.');
        },
      });
    }
  }

  confirmDelete(id: number) {
    if (!id) {
      alert('Contact id missing');
      return;
    }
    if (!confirm('Delete this emergency contact?')) return;
    this.contactService.deleteContact(id).subscribe({
      next: () => {
        this.contacts = this.contacts.filter((c) => c.id !== id);
      },
      error: (err) => {
        console.error('Failed to delete contact', err);
        alert('Could not delete contact.');
      },
    });
  }

  /** Helpers */
  fullName(c: any) {
    return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ');
  }

  combinedAddress(a: any) {
    if (!a) return '';
    if (a.text) return a.text;
    return [
      a.line1 || a.addressText || a.line,
      a.line2,
      a.city,
      a.district,
      a.state,
      a.postalCode,
      a.country,
    ]
      .filter(Boolean)
      .join(', ');
  }
}
