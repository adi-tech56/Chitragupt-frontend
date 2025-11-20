import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth-service.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent {
patientDetailsComplete: boolean = false;
patientContactsComplete:boolean = false;
private auth = inject(AuthService);
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

  }

  checkPatientDetails() {
    // this.patientDetailsComplete = this.patientService.isPatientDetailsComplete();
  }

  
}
