import { Component, inject } from '@angular/core';
import { catchError, forkJoin, of, finalize } from 'rxjs';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { LoaderService } from 'src/app/core/Services/loader.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css'],
})
export class UserLayoutComponent {
  patientDetailsComplete = false;
  patientContactsComplete = false;
  patientAllergyComplete = false;

  private auth = inject(AuthService);
  private patientContactService = inject(PatientContactService);
  private patientProfileService = inject(PatientProfileService);
  private loaderService = inject(LoaderService);

  userName: string = '';
  greetingMessage: string = '';

  setGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) this.greetingMessage = 'Good Morning';
    else if (hour >= 12 && hour < 17) this.greetingMessage = 'Good Afternoon';
    else if (hour >= 17 && hour < 21) this.greetingMessage = 'Good Evening';
    else this.greetingMessage = 'Good Night';
  }

  onDetailsSubmitted() {
    this.patientDetailsComplete = true;
  }

  onContactSubmitted() {
    this.patientContactsComplete = true;
  }

  onAllergySubmitted() {
    this.patientAllergyComplete = true;
  }

  ngOnInit(): void {
    this.setGreeting();
    this.userName = this.auth.getUserName();

    this.loaderService.show();

    forkJoin({
      contactRes: this.patientContactService
        .getContact()
        .pipe(catchError(() => of({ hasContact: false }))),
      profileRes: this.patientProfileService
        .getProfile()
        .pipe(catchError(() => of({ hasProfile: false }))),
    })
      .pipe(finalize(() => this.loaderService.hide()))
      .subscribe(({ contactRes, profileRes }) => {
        this.patientContactsComplete = contactRes.hasContact ?? false;
        this.patientDetailsComplete = profileRes.hasProfile ?? false;

        // Allergy can be checked later OR assumed false on first load
        this.patientAllergyComplete = false;
      });
  }
}
