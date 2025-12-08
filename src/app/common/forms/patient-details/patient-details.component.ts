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

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: PatientProfileService,
    private toaster: ToastService
  ) {
    this.patientForm = this.fb.group({
      birthDate: ['', [Validators.required, this.futureDateValidator]],
      gender: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      addresses: this.fb.array([this.createAddressGroup()]),
      telecoms: this.fb.array([this.createTelecomGroup()]),
    });
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
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      country: ['', Validators.required],
    });
  }

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: ['', Validators.required],
      value: ['', [Validators.required, this.phoneValidator]],
    });
  }

  futureDateValidator(control: AbstractControl) {
    if (!control.value) return null;

    const selected = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selected > today ? { futureDate: true } : null;
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

  addAddress() {
    this.addresses.push(this.createAddressGroup());
  }

  removeAddress(index: number) {
    if (this.addresses.length > 1) this.addresses.removeAt(index);
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
    if (
      this.currentStep === 1 &&
      (this.patientForm.get('birthDate')?.invalid ||
        this.patientForm.get('gender')?.invalid ||
        this.patientForm.get('maritalStatus')?.invalid)
    ) {
      this.patientForm.markAllAsTouched();
      return;
    }

    if (this.currentStep === 2 && this.addresses.invalid) {
      this.addresses.markAllAsTouched();
      return;
    }

    this.currentStep++;
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onSubmit() {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const patientId = this.auth.getUserId();

    const payload = {
      ...this.patientForm.value,
      patientId: patientId,
    };
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
