import { Component } from '@angular/core';
import { Router } from '@angular/router';
type AuthStep = 'login' | 'signup' | 'otp' | 'details';
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']
})

export class AuthLayoutComponent {
constructor(private router: Router) { }
  currentStep: AuthStep = 'login'; 
  userNeedsDetails = false;         // Check after login
  goToStep(step: AuthStep) {
    this.currentStep = step;
  }
  onLoginSuccess(detailsIncomplete: boolean) {
    if (detailsIncomplete) {
      this.userNeedsDetails = true;
      this.goToStep('details');
    } else {
      // redirect to main app/dashboard etc.
      console.log('Login complete — navigate to dashboard');
      this.router.navigate(['/user'])
    }
  }
}
