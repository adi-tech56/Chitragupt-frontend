import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import cities from '../../../../assets/data/india-locations.json';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';

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

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private profileService: PatientProfileService
  ) {
    this.patientForm = this.fb.group({
      birthDate: ['', Validators.required],
      gender: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      addresses: this.fb.array([this.createAddressGroup()]),
      telecoms: this.fb.array([this.createTelecomGroup()]),
    });
  }

  createAddressGroup(): FormGroup {
    return this.fb.group({
      addressUse: ['', Validators.required],
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

  createTelecomGroup(): FormGroup {
    return this.fb.group({
      system: ['Phone', Validators.required],
      useCode: ['', Validators.required],
      value: ['', Validators.required],
    });
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
    if (this.currentStep < this.maxStep) this.currentStep++;
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
        alert('Patient profile updated');
        this.detailsSubmitted.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update profile');
      },
    });
  }
}
