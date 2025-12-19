import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { LocationService } from 'src/app/core/Services/location-service';
import { Location } from '@angular/common';
import { ToastService } from 'src/app/core/Services/toast.service';
declare var bootstrap: any;

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.css'],
})
export class ContactPageComponent implements OnInit, OnDestroy {

  contacts: any[] = [];
  firstLetter = '';

  isEditMode = false;
  editingId: number | null = null;

  // dropdowns & dataset
  relationshipOptions: any[] = [];
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
  removedTelecomIds: number[] = [];
  removedAddressIds: number[] = [];
  isPostalAutoFilled: boolean[] = [];

  // store one Subscription per address (composite subscription)
  private subs: Subscription[] = [];

  // reactive modal form (uses backend field names contactTelecoms/contactAddresses)
  contactForm: FormGroup;
  private phoneRegex = /^(?!.*^(\d)\1{9}$)\d{10}$/;

  constructor(
    private fb: FormBuilder,
    private contactService: PatientContactService,
    private locationService: LocationService,
    private http: HttpClient,
    private auth: AuthService,
    private location: Location,
    private toaster: ToastService
  ) {
    // build form with same shape as your backend expects
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: [''],
      relationshipType: ['', Validators.required],
      patientId: [this.auth.getUserId()],
      contactTelecoms: this.fb.array([]),
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

    // // load relationship types
    // this.http
    //   .get<any[]>('assets/data/relations-type.json')
    //   .subscribe((data) => {
    //     if (!data) return;
    //     if (typeof data[0] === 'string')
    //       this.relationshipOptions = data as string[];
    //     else
    //       this.relationshipOptions = (data as any[]).map(
    //         (x) => x.display ?? x.code ?? x
    //       );
    //   });
    this.http
      .get<any[]>('assets/data/relations-type.json')
      .subscribe((data) => (this.relationshipOptions = data || []));

    // // load city/state/country dataset
    // this.http.get<any[]>('assets/data/india-locations.json').subscribe(
    //   (list) => {
    //     this.cityData = list || [];
    //     this.citiesList = Array.from(
    //       new Set(this.cityData.map((x) => x.city))
    //     ).sort();
    //     this.statesList = Array.from(
    //       new Set(this.cityData.map((x) => x.state))
    //     ).sort();
    //     this.countries = Array.from(
    //       new Set(this.cityData.map((x) => x.country))
    //     ).sort();

    //     // initialise filtered lists for first address
    //     this.filteredCities[0] = this.citiesList.slice(0, 200);
    //     this.filteredStates[0] = this.statesList.slice(0, 200);
    //     this.filteredCountries[0] = this.countries.slice(0, 200);
    //   },
    //   (err) => console.warn('Failed to load india-locations.json', err)
    // );

    // // ensure ui flags exist for index 0
    // this.showCountry[0] = false;
    // this.showState[0] = false;
    // this.showCity[0] = false;
    this.isPostalAutoFilled[0] = false;
    this.setupAddressAutocomplete(0);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s?.unsubscribe());
  }

  /** form group factories **/
createAddressGroup(): FormGroup {
  return this.fb.group({
    id: [null],
    useCode: ['', Validators.required],
    addressType: [''],
    text: ['', Validators.required],
    line1: [''],
    line2: [''],
    postalCode: ['', Validators.required],
    city: [{ value: '', disabled: true }, Validators.required],
    state: [{ value: '', disabled: true }, Validators.required],
    country: ['India', Validators.required],
  });
}


 

  createTelecomGroup(
    system: 'email' | 'phone',
    value = '',
    id: any = null,
    isFirstTelecom: boolean = false
  ): FormGroup {
    return this.fb.group({
      id: [id ?? null],
      system: [
        { value: system, disabled: isFirstTelecom },
        Validators.required,
      ],
      useCode: [''],
      value: [value, Validators.required],
    });
  }

  /** getters **/
  get contactTelecoms(): FormArray {
    return this.contactForm.get('contactTelecoms') as FormArray;
  }
  getRelationshipDisplay(code: string): string {
    if (!code || !this.relationshipOptions?.length) return '-';

    const found = this.relationshipOptions.find(
      (r: any) => r.code === code
    );

    return found?.display ?? code;
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
    // if no telecoms exist (shouldn't happen because we always ensure first is email), add first as email
    if (this.contactTelecoms.length === 0) {
      const g = this.createTelecomGroup('email', '', null);
      this.contactTelecoms.push(g);
      this.updateTelecomValidators(0);
      return;
    }

    const g = this.createTelecomGroup('phone', '', null);
    this.contactTelecoms.push(g);
    const idx = this.contactTelecoms.length - 1;
    this.updateTelecomValidators(idx);
    // subscribe to system changes for placeholder/validators
    this.contactTelecoms
      .at(idx)
      .get('system')!
      .valueChanges.subscribe(() => this.updateTelecomValidators(idx));
  }

  removeTelecom(index: number) {
    if (this.contactTelecoms.length <= 1) return;

    const group = this.contactTelecoms.at(index) as FormGroup;
    const id = group?.get('id')?.value;
    if (id) this.removedTelecomIds.push(id);

    this.contactTelecoms.removeAt(index);
  }

  addAddress() {
    this.contactAddresses.push(this.createAddressGroup());
    const idx = this.contactAddresses.length - 1;

    this.isPostalAutoFilled[idx] = false;

    this.setupAddressAutocomplete(idx);

  }

  removeAddress(index: number) {
    if (this.contactAddresses.length <= 1) return;

    const group = this.contactAddresses.at(index) as FormGroup;
    const id = group?.get('id')?.value;
    if (id) this.removedAddressIds.push(id);

    const s = this.subs[index];
    if (s) {
      s.unsubscribe();
      this.subs.splice(index, 1);
    }
    this.isPostalAutoFilled.splice(index, 1);
    this.contactAddresses.removeAt(index);

  }

  /**
   * Update validators & placeholder for a telecom index based on its system
   */
  updateTelecomValidators(index: number) {
    const group = this.contactTelecoms.at(index) as FormGroup;
    const system = group.get('system')?.value;

    const valueControl = group.get('value')!;
    valueControl.clearValidators();

    if (system === 'email') {
      valueControl.setValidators([Validators.required, Validators.email]);
    } else {
      valueControl.setValidators([
        Validators.required,
        Validators.pattern(this.phoneRegex),
      ]);
    }
    valueControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  getTelecomValueControl(index: number) {
    return (this.contactTelecoms.at(index) as FormGroup).get(
      'value'
    ) as AbstractControl;
  }

  getTelecomSystem(index: number) {
    return (this.contactTelecoms.at(index) as FormGroup).get('system')?.value;
  }

  getTelecomPlaceholder(index: number) {
    const sys = this.getTelecomSystem(index);
    if (sys === 'email') return 'user@example.com';
    return 'eg : 9876546758';
  }
private resetCityState(
  group: FormGroup,
  index: number,
  enable: boolean
) {
  group.patchValue({ city: '', state: '' });

  if (enable) {
    group.get('city')?.enable();
    group.get('state')?.enable();
  } else {
    group.get('city')?.disable();
    group.get('state')?.disable();
  }

  this.isPostalAutoFilled[index] = false;
}

  /** address autocomplete setup (same as your previous implementation) **/
/** Called on postal code value change */
setupAddressAutocomplete(index: number) {
  const group = this.contactAddresses.at(index) as FormGroup;

  const sub = group.get('postalCode')!.valueChanges
    .pipe(debounceTime(400), distinctUntilChanged())
    .subscribe((postalCode: string) => {
      const country = group.get('country')?.value;
      if (!postalCode || !country) return;

      let regex: RegExp;
      let countryCode = '';

      if (country === 'India') {
        regex = /^[1-9][0-9]{5}$/;
        countryCode = 'IN';
      } else if (country === 'USA') {
        regex = /^\d{5}(-\d{4})?$/;
        countryCode = 'US';
      } else {
        regex = /.*/;
      }

      const postalCtrl = group.get('postalCode')!;

      /** ❌ Invalid format → stop */
      if (!regex.test(postalCode)) {
        postalCtrl.setErrors({ pattern: true });
        this.resetCityState(group, index, false);
        return;
      }

      postalCtrl.setErrors(null);

      /** ✅ Call backend */
      this.locationService.lookupByPostalCode(countryCode, postalCode)
        .subscribe({
          next: (res) => {
            group.patchValue({
              city: res.city,
              state: res.state,
              country: res.country === 'IN' ? 'India' :
                       res.country === 'US' ? 'USA' : res.country,
            });

            group.get('city')?.disable();
            group.get('state')?.disable();
            this.isPostalAutoFilled[index] = true;
          },
          error: () => {
            this.resetCityState(group, index, true);
            this.toaster.show(
              'Postal code not found. Please enter city and state manually.',
              'warning'
            );
          },
        });
    });

  this.subs.push(sub);
}


/** Called on country change to update postal validators dynamically */
onCountryChange(index: number) {
  const group = this.contactAddresses.at(index) as FormGroup;

  group.patchValue({
    postalCode: '',
    city: '',
    state: '',
  });

  group.get('city')?.disable();
  group.get('state')?.disable();

  this.isPostalAutoFilled[index] = false;
}


  /** Load contacts from backend */
  loadContacts() {

    this.contactService.getContact().subscribe({
      next: (res: any) => {
        this.contacts = res?.contacts ?? [];
      },
      error: (err) => console.error('Failed to load contacts', err),

    });
  }

  /** Open add modal */
  openAddModal() {
    this.isEditMode = false;
    this.editingId = null;
    this.removedTelecomIds = [];
    this.removedAddressIds = [];

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

    // ensure first telecom is email (disabled in UI)
    const first = this.createTelecomGroup('email', '', null);
    this.contactTelecoms.push(first);
    this.updateTelecomValidators(0);

    // ensure at least one address
    this.contactAddresses.push(this.createAddressGroup());
    this.setupAddressAutocomplete(0);

    const modalEl = document.getElementById('editContactModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  /** Open edit modal and populate form (preserves ids) */
  openEditModal(contact: any) {
    this.isEditMode = true;
    this.editingId = contact.id ?? null;
    this.removedTelecomIds = [];
    this.removedAddressIds = [];

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

    // populate telecoms (enforce first as email)
    const telList =
      contact.contactTelecoms && contact.contactTelecoms.length
        ? contact.contactTelecoms
        : [{ id: null, system: 'email', useCode: '', value: '' }];

    telList.forEach((t: any, idx: number) => {
      // if first index ensure system = email (force)
      const system = idx === 0 ? 'email' : t.system ?? 'phone';
      const group = this.createTelecomGroup(
        system,
        t.value ?? '',
        t.id ?? null
      );
      this.contactTelecoms.push(group);
      this.updateTelecomValidators(idx);
      // subscribe to system changes for dynamic validators (except first since disabled)
      if (idx > 0) {
        group
          .get('system')!
          .valueChanges.subscribe(() => this.updateTelecomValidators(idx));
      } else {
        // make sure the first control has system 'email' (and disabled in template)
        group.get('system')!.setValue('email', { emitEvent: false });
      }
    });

    // populate addresses (preserve id)
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
    // mark touched to show validation
    this.contactForm.markAllAsTouched();

    // ensure first telecom exists and is email
    if (this.contactTelecoms.length === 0) {
      this.toaster.show(
        'Please add an email contact (first telecom).',
        'error'
      );
      return;
    }

    if (this.getTelecomSystem(0) !== 'email') {
      this.toaster.show('The first telecom must be an Email!', 'error');
      return;
    }

    // ensure validators are up-to-date for all telecoms
    for (let i = 0; i < this.contactTelecoms.length; i++)
      this.updateTelecomValidators(i);

    if (this.contactForm.invalid) {
      console.log('Form is invalid. Below are the invalid fields:');
      this.logInvalidFields(this.contactForm);
      this.toaster.show('Please fill required fields correctly!', 'error');
      return;
    }

    // payload already matches backend dto keys
    const payload = {
      ...this.contactForm.getRawValue(),
      patientId: this.auth.getUserId(),
      removedTelecomIds: this.removedTelecomIds,
      removedAddressIds: this.removedAddressIds,
    };

    if (this.isEditMode && this.editingId) {
      this.contactService.updateContact(this.editingId, payload).subscribe({
        next: (res) => {
          const idx = this.contacts.findIndex((c) => c.id === this.editingId);
          if (idx >= 0) this.contacts[idx] = res;
          else this.loadContacts();
          (
            document.querySelector(
              '#editContactModal .btn-close'
            ) as HTMLElement
          )?.click();
        },
        error: (err) => {
          console.error('Failed to update contact', err);
          this.toaster.show('Could not save contact.!', 'error');
        },
      });
    } else {
      this.contactService.saveContact(payload).subscribe({
        next: (res) => {
          this.contacts.push(res);
          (
            document.querySelector(
              '#editContactModal .btn-close'
            ) as HTMLElement
          )?.click();
        },
        error: (err) => {
          console.error('Failed to save contact', err);
          this.toaster.show('Could not save contact.!', 'error');
        },
      });
    }
  }

  confirmDelete(id: number) {
    if (!id) {
      this.toaster.show('Contact id missing!', 'error');
      return;
    }
    if (!confirm('Delete this emergency contact?')) return;
    this.contactService.deleteContact(id).subscribe({
      next: () => {
        this.contacts = this.contacts.filter((c) => c.id !== id);
      },
      error: (err) => {
        console.error('Failed to delete contact', err);
        this.toaster.show('Could not delete contact!', 'error');
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

  /** small helper used in template to mark invalid fields */
  isInvalid(control: AbstractControl | null | undefined) {
    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty || this.contactForm.touched)
    );
  }
}
