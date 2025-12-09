import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css'],
})
export class UserLayoutComponent {
  patientDetailsComplete: boolean = false;
  patientContactsComplete: boolean = false;
  patientAllergyComplete: boolean = false;
  loading: boolean = true;
  private auth = inject(AuthService);
  private patientContactService = inject(PatientContactService);
  private patientProfileService = inject(PatientProfileService);
  userName: any;
  greetingMessage: string = '';
  openAllergyFormFromProfile: boolean = false;
  forceAddAllergy: boolean = false;

  setGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      this.greetingMessage = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      this.greetingMessage = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      this.greetingMessage = 'Good Evening';
    } else {
      this.greetingMessage = 'Good Night';
    }
  }

  onDetailsSubmitted() {
    this.patientDetailsComplete = true;
  }

  onContactSubmitted() {
    console.log('Event received!');
    this.patientContactsComplete = true;
  }

  onAllergySubmitted() {
    console.log('Event received!');
    this.patientAllergyComplete = true;
  }

  ngOnInit(): void {
    this.setGreeting();
    this.userName = this.auth.getUserName();
    this.loading = true;

    forkJoin({
      contactRes: this.patientContactService.getContact().pipe(
        catchError((err) => {
          console.error(
            'Contact API failed because no patient contact exist for this patient:',
            err
          );
          return of({ hasContact: false }); // default when contact missing
        })
      ),
      profileRes: this.patientProfileService.getProfile().pipe(
        catchError((err) => {
          console.error(
            'Profile API failed because no patient profile exist for this patient:',
            err
          );
          return of({ hasProfile: false }); // default when profile missing
        })
      ),
    }).subscribe(({ contactRes, profileRes }) => {
      this.patientContactsComplete = contactRes.hasContact ?? false;
      this.patientDetailsComplete = profileRes.hasProfile ?? false;
      this.loading = false;
    });
  }

  checkPatientDetails() {
    // this.patientDetailsComplete = this.patientService.isPatientDetailsComplete();
  }
}
