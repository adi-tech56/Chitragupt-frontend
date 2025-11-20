import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { Medicine, Route } from 'src/app/core/Models/Medication';
import { MedicineService } from 'src/app/core/Services/AutoCompleteServices/medicine-service';
import { RouteService } from 'src/app/core/Services/AutoCompleteServices/route-service';



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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private routeService:RouteService

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

    console.log("Contact submit ")
    this.contactSubmitted.emit();   // Notify parent

  }
}

