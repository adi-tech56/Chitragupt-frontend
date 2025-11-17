import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserRegisterDetails } from 'src/app/core/Models/Authentication';
import { AuthService } from 'src/app/core/Services/auth-service.service';

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
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @Output() signupSuccess = new EventEmitter<void>();
  @Output() cancelSignup = new EventEmitter<void>();
  private auth = inject(AuthService);

  formSubmit =true;
 form = new FormGroup({
   firstName: new FormControl('', { validators: [Validators.required] }),
    middleName: new FormControl(''),
    lastName: new FormControl('', {
      validators: [Validators.required]
    }),
  
    //nested form group
    passwords: new FormGroup({
      password: new FormControl('', {
        validators: [Validators.minLength(6), Validators.required]
      }),
      confirmPassword: new FormControl('', {
        validators: [Validators.minLength(6), Validators.required]
      }),
    }, {
      validators: [valuesCheck('password', 'confirmPassword')],
    }),
   
    contactNo: new FormControl('', {
      validators: [Validators.minLength(10),   // Minimum 10 digits (or as per requirement)
      Validators.required,
      Validators.maxLength(15) ]
    }),
      emailId: new FormControl('', {
      validators: [Validators.email, Validators.required]
    }),
 


  });
passwordCheck = this.form.get('passwords') as FormGroup;
  response: any;
    googleSignIn() {
 window.location.href = "http://localhost:8089/oauth2/authorization/google";
}
  onCountryChange(event: any) {
    const selectedCode = event.target.value;
    console.log('Selected Country Code:', selectedCode);

    // Set the dial code in contactNo if country is changed
    const currentContact = this.form.get('contactNo')?.value;
    this.form.get('contactNo')?.setValue(selectedCode + currentContact);
  }

  onSignup() {
     if (this.form.invalid) {
        this.formSubmit = false;
        console.log("Form invalid")
        return;
      }
    const { firstName,lastName,middleName,emailId,contactNo } = this.form.value;
    const{password} = this.passwordCheck.value;
//Signup service
  
    const userRegister: UserRegisterDetails = {
      firstName: <string>firstName,
      middleName: <string>middleName,
      lastName: <string>lastName,
      contactNo: <string>contactNo,
      email: <string>emailId,
      passWord: <string>password
    }

    this.auth.signup(userRegister).subscribe({
      next: (res) => {
        this.response = res;
        console.log('Post created successfully:', res);
     
        this.signupSuccess.emit(res); 
      },
      error: (err) => {
        console.error('Error creating post:', err);
      }
    });

  }
  cancel() {
    this.cancelSignup.emit(); 
  }
    onReset() {
    this.form.reset();
  }
}
