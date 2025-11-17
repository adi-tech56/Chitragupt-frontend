import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { UserLoginDetails } from 'src/app/core/Models/Authentication';
import { AuthService } from 'src/app/core/Services/auth-service.service';


let initialEmail = '';
const savedForm = window.localStorage.getItem('saved-login-form');
if (savedForm) {
  const loadForm = JSON.parse(savedForm);
  initialEmail = loadForm.email;
}

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

  email = '';
  password = '';
  userReset: Boolean = false;
  formSubmit = true;

  ngOnInit(): void {
    this.loginForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        localStorage.setItem('saved-login-form', JSON.stringify(value));
      });
  }


  loginForm = new FormGroup({
    email: new FormControl(initialEmail, [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)])
  });
  response: any;
  get passwordIsInvalid() {
    return (this.loginForm.controls.password.touched && this.loginForm.controls.password.dirty &&
      this.loginForm.controls.password.invalid);
  }
  googleSignIn() {
 window.location.href = "http://localhost:8089/oauth2/authorization/google";
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
        
        this.loginSuccess.emit();
      },
      error: (err) => {
        console.error('Error creating post:', err);
      }
    });

  }
}
