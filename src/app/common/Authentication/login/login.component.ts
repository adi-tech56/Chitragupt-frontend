import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { UserLoginDetails } from 'src/app/core/Models/Authentication';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { ToastService } from 'src/app/core/Services/toast.service';
import { TokenRefreshService } from 'src/app/core/Services/token-refresh.service';


let initialEmail = '';
// const savedForm = window.localStorage.getItem('saved-login-form');
// if (savedForm) {
//   const loadForm = JSON.parse(savedForm);
//   initialEmail = loadForm.email;
// }

const savedEmail = localStorage.getItem('saved-email') || '';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  @Output() signupRequest = new EventEmitter<void>();
  @Output() passwordReset = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<boolean>();
  private auth = inject(AuthService);
  private tokenRefresh = inject(TokenRefreshService);
  private toast= inject(ToastService) 
  email = '';
  password = '';
  userReset: Boolean = false;
  formSubmit = true;
  loginError: string = '';
  invalidFieldsMessage: string = '';


  ngOnInit(): void {
    const savedEmail = localStorage.getItem('saved-email') || '';
    this.loginForm.patchValue({ email: savedEmail });

    const emailControl = this.loginForm.get('email');

    emailControl?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(email => {
        if (emailControl.valid) {
          localStorage.setItem('saved-email', email || '');
        }
      });
  }


  loginForm = new FormGroup({
    email: new FormControl(initialEmail, [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });
  response: any;
  showPassword = false;


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  get passwordControl() {
    return this.loginForm.get('password');
  }

  get showRequiredError() {
    return this.passwordControl?.touched && this.passwordControl?.hasError('required');
  }

  get showMinLengthError() {
    return this.passwordControl?.touched && this.passwordControl?.hasError('minlength');
  }

  get emailIsInvalid() {
    return (this.loginForm.controls.email.touched && this.loginForm.controls.email.dirty &&
      this.loginForm.controls.email.invalid);
  }
  googleSignIn() {
    window.location.href = "http://localhost8089:/oauth2/authorization/google";
    
  }
  goToSignup() {
    this.signupRequest.emit();
  }
  goToSendMail() {
    this.passwordReset.emit();
  }
  onLogin() {
    if (this.loginForm.invalid) {
      this.formSubmit = false;
      console.log("Form invalid")
      return;
    }

    const { email, password } = this.loginForm.value;


    const userData: UserLoginDetails = {
      userEmail: <string>email,
      passWord: <string>password,
    }

    this.auth.login(userData).subscribe({
      next: (res) => {
        this.response = res;
        console.log('Post created successfully:', res);
        this.toast.show('Login Succesful.',  'success');
        this.tokenRefresh.startAutoRefresh();
        this.loginSuccess.emit();
        this.loginError = '';
      },
      error: (err) => {
        console.error('Error creating post:', err);
        if (err.error && err.error.error) {
          const backendMsg = err.error.error;

          if (backendMsg.includes('Bad credentials')) {
       
            this.toast.show('Incorrect password. Please try again.',  'error');

          } else if (backendMsg.includes('Invalid email or password')) {
       
            this.toast.show('Invalid email or password. Please check your credentials.',  'error');
          } else if (backendMsg.includes('User signed up via OAuth')) {
            this.toast.show('This account uses OAuth login. Please sign in with Google or set a password to use email login.','error');
          } else {
           this.toast.show( 'Login failed. ' + backendMsg,'error');
          }
        } else {
          this.loginError = 'Login failed. Please try again.';
          this.toast.show( 'Login failed. Please try again.','error');
        }
      }
    });

  }
}
