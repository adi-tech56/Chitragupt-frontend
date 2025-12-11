import { Component, ElementRef, EventEmitter, inject, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/core/Services/auth-service.service';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent {
  @Input() signupData: any;
  @Output() otpVerified = new EventEmitter<void>();

  private auth = inject(AuthService);
  otpForm = new FormGroup({
    otp: new FormArray(Array.from({ length: 6 }, () => new FormControl('')))
  });

  get otpControls() {
    return (this.otpForm.get('otp') as FormArray).controls;
  }

  moveNext(event: any, i: number) {
    const input = event.target;
    const value = input.value;
    if (!/^\d$/.test(value)) input.value = '';

    if (value && i < this.otpControls.length - 1) {

      input.parentElement.children[i + 1].focus();
    }
    if (event.key === 'Backspace' && !value && i > 0) {
      input.parentElement.children[i - 1].focus();
    }


  }
  // verifyOtp() {
  //   const otpArray = (this.otpForm.get('otp') as FormArray).value; // array of 6 digits
  //   const otp = otpArray.join(''); // join digits into one string
  //   console.log('Entered OTP:', otp);

  //   // You can emit or send this OTP to the backend
  //   this.otpVerified.emit();
  // }
  verifyOtp() {
    if (this.otpForm.invalid) {
      console.log("OTP form invalid");
      return;
    }

    const otpArray = (this.otpForm.get('otp') as FormArray).value;
    const otp = otpArray.join('');
    console.log("Entered OTP:", otp);

    const payload = {
      email: this.signupData?.email,   // coming from parent container
      otp: otp
    };


    this.auth.verifyOTP(payload).subscribe({
      next: (res) => {
        console.log("OTP verification success:", res);

        this.otpVerified.emit();
      },
      error: (err) => {
        console.error("OTP verification failed:", err);
      }
    });
  }

 private initialTimeInSeconds = 300; // 5 minutes
public timeLeft: number = this.initialTimeInSeconds;
public formattedTime: string = '05:00';
public isTimerActive: boolean = true;
private countdownInterval: any;

ngOnInit(): void {
  this.startTimer();
}

ngOnDestroy(): void {
  if (this.countdownInterval) {
    clearInterval(this.countdownInterval);
  }
}

startTimer(): void {
  this.isTimerActive = true;
  this.timeLeft = this.initialTimeInSeconds;
  this.updateFormattedTime();

  this.countdownInterval = setInterval(() => {
    this.timeLeft--;
    this.updateFormattedTime();

    if (this.timeLeft <= 0) {
      this.stopTimer();
    }
  }, 1000);
}

stopTimer(): void {
  clearInterval(this.countdownInterval);
  this.isTimerActive = false;
}

updateFormattedTime(): void {
  const minutes = Math.floor(this.timeLeft / 60);
  const seconds = this.timeLeft % 60;
  this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

  resendOtp(): void {
    // 1. Place your API call to resend the OTP here
    console.log("Resending OTP...");
    // e.g., this.authService.resendOtpRequest().subscribe(...)

    // 2. Restart the timer once the API call is successful
    this.startTimer();
  }
}
