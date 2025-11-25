import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { PatientContactService } from 'src/app/core/Services/patient-contact.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent {
patientDetailsComplete: boolean = true;
patientContactsComplete:boolean = false;
private auth = inject(AuthService);
private patientContactService = inject(PatientContactService);
userName: any;
greetingMessage: string = '';

setGreeting() {
  const hour = new Date().getHours();

  if (hour >= 12&& hour < 12) {
    this.greetingMessage = 'Good Morning';
  }
  else if (hour >= 12 && hour < 17) {
    this.greetingMessage = 'Good Afternoon';
  }
  else if (hour >= 17 && hour < 21) {
    this.greetingMessage = 'Good Evening';
  }
  else {
    this.greetingMessage = 'Good Night';
  }
}



onDetailsSubmitted() {
  this.patientDetailsComplete = true;
}


onContactSubmitted() {
  console.log("Event received!");
  this.patientContactsComplete = true;
}

  ngOnInit(): void {
    this.checkPatientDetails();
     this.setGreeting();
    this.userName = this.auth.getUserName();
    console.log(this.userName)
     this.patientContactService.getContact().subscribe({
    next: (res) => {
      if (res.hasContact) {
      this.patientContactsComplete = true;
      } else {
        this.patientContactsComplete = false;
      }
    },
    error: (err) => {
      console.error('Error fetching contact:', err);
    }
  });

  }

  checkPatientDetails() {
    // this.patientDetailsComplete = this.patientService.isPatientDetailsComplete();
  }


}
