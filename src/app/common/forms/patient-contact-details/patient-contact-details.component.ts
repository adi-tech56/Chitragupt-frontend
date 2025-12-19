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
import { LocationService, PostalLookupResult } from 'src/app/core/Services/location-service';
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
  isPostalAutoFilled: boolean[] = [];

  contactForm: FormGroup;

  relationshipTypes: any[] = [];
  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private locationService: LocationService, // optional, still available if used elsewhere
    private patientContactService: PatientContactService,
    private auth: AuthService,
    private toaster: ToastService,


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
    this.isPostalAutoFilled[0] = false;

    this.http
      .get<any[]>('assets/data/relations-type.json')
      .subscribe((data) => (this.relationshipTypes = data || []));
    // this.showCountry[0] = false;
    // this.showState[0] = false;
    // this.showCity[0] = false;

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
  const group = this.contactAddresses.at(index) as FormGroup;
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
  const group = this.contactAddresses.at(index) as FormGroup;
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
      value: ['', [Validators.required, this.phoneValidator]],
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
    this.isPostalAutoFilled[idx] = false;

    this.setupAddressAutocomplete(idx);
  }

 removeAddress(index: number) {
  if (this.contactAddresses.length > 1) {
    this.contactAddresses.removeAt(index);
 
    this.subs[index]?.unsubscribe();
    this.subs.splice(index, 1);
  }
  this.isPostalAutoFilled.splice(index, 1);
}

  addTelecom() {
    this.contactTelecoms.push(this.createTelecomGroup());
  }

  removeTelecom(index: number) {
    if (this.contactTelecoms.length > 1) this.contactTelecoms.removeAt(index);
  }

setupAddressAutocomplete(index: number) {
  const group = this.contactAddresses.at(index) as FormGroup;
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


  private filterOptions(list: string[], value: any): string[] {
    const q = (value || '').toString().toLowerCase().trim();
    if (!q) return list.slice(0, 200);
    return list.filter((x) => x.toLowerCase().includes(q)).slice(0, 200);
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
      ...this.contactForm.getRawValue(),
      patientId: patientId,
    };
// console.log(payload)
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
