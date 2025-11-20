import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.css']
})
export class PatientDetailsComponent {
@Output() detailsSubmitted = new EventEmitter<void>();
  currentStep = 1;
  maxStep = 3;

  patientForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
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


  nextStep() {
    if (this.currentStep < this.maxStep) this.currentStep++;
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }




  onSubmit() {
    if (this.patientForm.valid) {
      console.log('Patient Data:', this.patientForm.value);
         this.detailsSubmitted.emit(); 
      this.router.navigate(['/user']);
   
    } else {
      console.warn('Form Invalid');
      this.patientForm.markAllAsTouched(); // show validation errors
    }
  }
}
