import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent {
patientDetailsComplete: boolean = true;

  // constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.checkPatientDetails();
  }

  checkPatientDetails() {
    // this.patientDetailsComplete = this.patientService.isPatientDetailsComplete();
  }

  onDetailsSubmitted() {
    // re-check after submission
    this.checkPatientDetails();
  }
}
