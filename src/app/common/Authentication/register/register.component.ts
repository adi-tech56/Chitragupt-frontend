import { Component, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

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
      validators: [Validators.minLength(10), Validators.required]
    }),
      emailId: new FormControl('', {
      validators: [Validators.email, Validators.required]
    }),
    userRole:new FormControl<'PATIENT' | 'ADMIN'>('PATIENT'),



  });
passwordCheck = this.form.get('passwords') as FormGroup;
  onSignup() {
     if (this.form.invalid) {
        this.formSubmit = false;
        console.log("Form invalid")
        return;
      }
    const { firstName,lastName,middleName,emailId,contactNo } = this.form.value;
    const{password} = this.passwordCheck.value;
//Signup service

    // TODO: send signup request
    this.signupSuccess.emit(); // move to OTP
  }
  cancel() {
    this.cancelSignup.emit(); 
  }
    onReset() {
    this.form.reset();
  }
}
