import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/Services/auth-service.service';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.css']
})
export class SendEmailComponent {
   formSubmit = true;
successMessage: string = '';
errorMessage: string = '';
  private auth = inject(AuthService);
 
  mailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),

  });
  response: any;
onSubmit() {
  if (this.mailForm.invalid) {
    this.formSubmit = false;
    this.successMessage = '';
    this.errorMessage = 'Form is invalid';
    return;
  }

  const email = <string>this.mailForm.value;

  this.auth.resetPassword(email).subscribe({
    next: (res) => {
      this.response = res;
      this.successMessage = 'Email sent successfully!';
      this.errorMessage = '';
      console.log('Mail sent successfully:', res);
    },
    error: (err) => {
      this.errorMessage = 'Error sending email. Please try again.';
      this.successMessage = '';
      console.error('Error creating post:', err);
    }
  });
}

}
