import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import cities from '../../../../assets/data/india-locations.json';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';
import { ToastService } from 'src/app/core/Services/toast.service';
import { LocationService } from 'src/app/core/Services/location-service';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.css'],
})
export class PatientDetailsComponent {
  @Output() detailsSubmitted = new EventEmitter<void>();
  currentStep = 1;
  maxStep = 3;
  patientForm: FormGroup;
  allCities: any[] = cities;
  filteredCities: any[] = [];
  cityDropdownIndex: number | null = null;
  today = new Date().toISOString().split('T')[0];
  isPostalAutoFilled: boolean[] = [];
  private subs: Subscription[] = [];
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: PatientProfileService,
    private toaster: ToastService,
    private locationService:LocationService,
    private http: HttpClient,
  ) {
    this.patientForm = this.fb.group({
      birthDate: ['', [Validators.required, this.noFutureDateValidator]],
      gender: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      addresses: this.fb.array([this.createAddressGroup()]),
      telecoms: this.fb.array([this.createTelecomGroup()]),
    });
  }

  ngOnInit() {
    this.isPostalAutoFilled[0] = false;
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
    city: [{ value: '', disabled: true }, Validators.required],
    state: [{ value: '', disabled: true }, Validators.required],
    postalCode: ['', Validators.required],
    country: ['India', Validators.required],
  });
}
lookupPostalCode(index: number) {
  const group = this.addresses.at(index) as FormGroup;
  const postalCode = group.get('postalCode')?.value;
  const country = group.get('country')?.value;
 let countryCode: string;

if (country === 'India') {
  countryCode = 'IN';
} else if (country === 'USA' || country === 'united states') {
  countryCode = 'US';
} else {
  countryCode = ''; // default or handle other countries
}

  if (!postalCode || !country) return;

  this.locationService.lookupByPostalCode(countryCode, postalCode).subscribe({
    next: (res) => {
       let countryName = res.country;
      if (res.country === 'IN') countryName = 'India';
      else if (res.country === 'US') countryName = 'USA';
      group.patchValue({
        city: res.city,
        state: res.state,
        country: countryName,
      });

      // Lock city/state fields
      group.get('city')?.disable();
      group.get('state')?.disable();
      this.isPostalAutoFilled[index] = true;
    },
    error: () => {
      this.isPostalAutoFilled[index] = false;

      // Keep city/state disabled
      group.get('city')?.disable();
      group.get('state')?.disable();
      group.patchValue({ city: '', state: '' });

      // Show toast
      this.toaster.show(
        'Postal code not found. Please enter a valid postal code.',
        'warning'
      );
    },
  });
}

onCountryChange(index: number) {
  const group = this.addresses.at(index) as FormGroup;
  const postalCtrl = group.get('postalCode');

  postalCtrl?.clearValidators();
  postalCtrl?.addValidators(Validators.required);

  const country = group.get('country')?.value;

  let regex: RegExp;
  if (country === 'India') regex = /^[1-9][0-9]{5}$/;
  else if (country === 'USA') regex = /^\d{5}(-\d{4})?$/;
  else regex = /.*/;

  postalCtrl?.addValidators(Validators.pattern(regex));
  postalCtrl?.updateValueAndValidity();
}

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: ['', Validators.required],
      value: ['', [Validators.required, this.phoneValidator]],
    });
  }

  noFutureDateValidator() {
    return (control: AbstractControl) => {
      if (!control.value) return null;

      const selected = new Date(control.value);
      const today = new Date();

      return selected > today ? { maxDate: true } : null;
    };
  }

  phoneValidator(control: any) {
    const value = control.value;
    if (!value) return null;
    if (!/^[0-9]{10}$/.test(value)) {
      return { invalidPhone: true };
    }
    if (/^(\d)\1{9}$/.test(value)) {
      return { sameDigit: true };
    }

    return null;
  }

  get addresses(): FormArray {
    return this.patientForm.get('addresses') as FormArray;
  }

  get telecoms(): FormArray {
    return this.patientForm.get('telecoms') as FormArray;
  }
private resetControlState(control: AbstractControl) {
  control.markAsPristine();
  control.markAsUntouched();

  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach(c =>
      this.resetControlState(c)
    );
  }
}

  addAddress() {
    this.addresses.push(this.createAddressGroup());
      const idx = this.addresses.length - 1;
    this.isPostalAutoFilled[idx] = false;

    this.setupAddressAutocomplete(idx);
  }

  removeAddress(index: number) {
    if (this.addresses.length > 1) 
      {this.addresses.removeAt(index);
           this.subs[index]?.unsubscribe();
    this.subs.splice(index, 1);
      }
      this.isPostalAutoFilled.splice(index, 1);
  }
setupAddressAutocomplete(index: number) {
  const group = this.addresses.at(index) as FormGroup;
  let firstEditDone = false;

  const sub = group
    .get('postalCode')!
    .valueChanges
    .pipe(
      debounceTime(300), // default debounce
      distinctUntilChanged()
    )
    .subscribe((val: string) => {
      const country = group.get('country')?.value;
      let regex: RegExp;
      let minLength = 1;

      if (country === 'India') {
        regex = /^[1-9][0-9]{5}$/;
        minLength = 6;
      } else if (country === 'USA') {
        regex = /^\d{5}(-\d{4})?$/;
        minLength = 5;
      } else {
        regex = /.*/;
        minLength = 1;
      }

      // First edit logic
      if (!firstEditDone) {
        if (!val || val.length < minLength) {
          // Do not show warning yet
          group.get('city')?.patchValue('');
          group.get('state')?.patchValue('');
          group.get('city')?.disable();
          group.get('state')?.disable();
          group.get('postalCode')?.setErrors(null);
          return;
        }
        firstEditDone = true; // mark that first valid-length edit has happened
      }

      // After first edit, debounce 300ms is applied (already set above)
      if (regex.test(val)) {
        this.lookupPostalCode(index);
      } else {
        group.get('city')?.patchValue('');
        group.get('state')?.patchValue('');
        group.get('city')?.disable();
        group.get('state')?.disable();
        group.get('postalCode')?.setErrors({ invalid: true });
        this.toaster.show('Please enter a valid postal code.', 'warning');
      }
    });

  this.subs.push(sub);
}
  addTelecom() {
    this.telecoms.push(this.createTelecomGroup());
  }

  removeTelecom(index: number) {
    if (this.telecoms.length > 1) this.telecoms.removeAt(index);
  }

  onCityInput(index: number) {
    const control = this.addresses.at(index).get('city');
    const value = control?.value.toLowerCase();
    if (!value) {
      this.filteredCities = [];
      this.cityDropdownIndex = null;
      return;
    }
    this.filteredCities = this.allCities.filter((c) =>
      c.city.toLowerCase().includes(value)
    );
    this.cityDropdownIndex = index;
  }

  selectCity(index: number, c: any) {
    this.addresses.at(index).patchValue({
      city: c.city,
      state: c.state,
      country: c.country,
      postalCode: c.postalCode,
    });
    this.filteredCities = [];
    this.cityDropdownIndex = null;
  }

 nextStep() {
  // STEP 1 validation
  if (this.currentStep === 1) {
    const step1Controls = [
      this.patientForm.get('birthDate'),
      this.patientForm.get('gender'),
      this.patientForm.get('maritalStatus'),
    ];

    const invalid = step1Controls.some(c => c?.invalid);

    if (invalid) {
      step1Controls.forEach(c => c?.markAsTouched());
      this.toaster.show("Please fill the form",'error')
      return;
    }

    // Reset step 2 before entering
    this.resetControlState(this.addresses);
  }

  // STEP 2 validation
  if (this.currentStep === 2) {
    if (this.addresses.invalid) {
      this.addresses.markAllAsTouched();
      return;
    }

    // Reset step 3 before entering
    this.resetControlState(this.telecoms);
  }

  this.currentStep++;
}


previousStep() {
  if (this.currentStep > 1) {
    this.currentStep--;

    const control =
      this.currentStep === 1
        ? this.patientForm
        : this.currentStep === 2
        ? this.addresses
        : this.telecoms;

    this.resetControlState(control);
  }
}


  onSubmit() {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const patientId = this.auth.getUserId();

    const payload = {
      ...this.patientForm.getRawValue(),
      patientId: patientId,
    };
    console.log(payload)
    this.profileService.saveProfile(patientId, payload).subscribe({
      next: (res) => {
        console.log('Saved successfully:', res);
        this.toaster.show('Profile saved successfully!', 'success');
        this.detailsSubmitted.emit();
      },
      error: (err) => {
        console.error(err);
        this.toaster.show('Profile is not saved , Error Occured!', 'error');
      },
    });
  }
}
