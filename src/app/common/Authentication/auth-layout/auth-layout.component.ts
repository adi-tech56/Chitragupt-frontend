import { Component } from '@angular/core';
import { Router } from '@angular/router';
type AuthStep = 'login' | 'signup' | 'otp' | 'send-mail';
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']
})

export class AuthLayoutComponent {
constructor(private router: Router) { }
  currentStep: AuthStep = 'login'; 
  signupResponse: any;
  userNeedsDetails = false;         // Check after login
  goToStep(step: AuthStep) {
    this.currentStep = step;
  }
  onLoginSuccess() {
    // if (detailsIncomplete) {
    //   this.userNeedsDetails = true;
    //   this.goToStep('details');
    // } else {
      // redirect to main app/dashboard etc.
      console.log('Login complete — navigate to dashboard');
      this.router.navigate(['/user'])
    // }
  }
  onSignupSuccess(response: any) {
  this.signupResponse = response;  // store response
  this.goToStep('otp');
}
}
