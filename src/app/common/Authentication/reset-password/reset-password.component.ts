import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/Services/auth-service.service'; // update path as needed

function valuesCheck(controlName1: string, controlName2: string) {
  return (control: AbstractControl) => {
    const val1 = control.get(controlName1)?.value;
    const val2 = control.get(controlName2)?.value;
    if (val1 === val2) {
      return null;
    }
    return { valuesNotEqual: true };
  }


}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  token!: string;

  resetForm = new FormGroup({
      password: new FormControl('', {
        validators: [Validators.minLength(6), Validators.required]
      }),
      confirmPassword: new FormControl('', {
        validators: [Validators.minLength(6), Validators.required]
      }),
    }, {
      validators: [valuesCheck('password', 'confirmPassword')],
  });

  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router:Router
  ) {}

  ngOnInit(): void {
    // Extract the token from URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    console.log('Extracted token:', this.token);
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.errorMessage = 'Please enter a valid password.';
      return;
    }

    const payload = {
      password: <string>this.resetForm.value.password!,
      confirmPassword:<string>this.resetForm.value.confirmPassword!,
      token: <string>this.token

    };

    this.auth.updatePassword(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Password has been reset successfully!';
        this.errorMessage = '';
        console.log(res);
         this.router.navigate(['/auth'])
      },
      error: (err) => {
        this.errorMessage = 'Failed to reset password.';
        this.successMessage = '';
        console.error(err);
      }
    });
  }
}
