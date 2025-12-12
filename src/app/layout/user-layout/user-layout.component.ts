import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, forkJoin, of, filter, finalize } from 'rxjs';
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
  showStepper = false;

  private auth = inject(AuthService);
  private patientContactService = inject(PatientContactService);
  private patientProfileService = inject(PatientProfileService);
  private loaderService = inject(LoaderService);
  private router = inject(Router);

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
  // Fix #1 → prevent ExpressionChanged error
  this.router.events
    .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      setTimeout(() => {
        this.showStepper = event.urlAfterRedirects === '/';
      }, 0);
    });

  // Show loader
  this.loaderService.show();

  // Fix #2 → wrap async updates
  forkJoin({
    contactRes: this.patientContactService.getContact().pipe(
      catchError((err) => {
        console.error('Contact API failed:', err);
        return of({ hasContact: false });
      })
    ),
    profileRes: this.patientProfileService.getProfile().pipe(
      catchError((err) => {
        console.error('Profile API failed:', err);
        return of({ hasProfile: false });
      })
    ),
  })
    .pipe(finalize(() => this.loaderService.hide()))
    .subscribe(({ contactRes, profileRes }) => {
      setTimeout(() => {
        this.patientContactsComplete = contactRes.hasContact ?? false;
        this.patientDetailsComplete = profileRes.hasProfile ?? false;
      }, 0);
    });
}

}
