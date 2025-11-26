import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './common/Authentication/login/login.component';
import { RegisterComponent } from './common/Authentication/register/register.component';

import { RouterOutlet } from '@angular/router';
import { HomeLayoutModule } from './layout/home-layout/home-layout.module';
import { AuthLayoutComponent } from './common/Authentication/auth-layout/auth-layout.component';
import { PatientDetailsComponent } from './common/forms/patient-details/patient-details.component';
import { VerificationComponent } from './common/Authentication/verification/verification.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserLayoutModule } from './layout/user-layout/user-layout.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ResetPasswordComponent } from './common/Authentication/reset-password/reset-password.component';
import { SendEmailComponent } from './common/Authentication/send-email/send-email.component';

import { MedicationPageComponent } from './common/user/medication-page/medication-page.component';
import { PatientContactDetailsComponent } from './common/forms/patient-contact-details/patient-contact-details.component';
import { AuthInterceptor } from './core/Interceptors/auth-interceptor';
import { ViewPrescriptionComponent } from './common/view-prescription/view-prescription.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    AuthLayoutComponent,
    VerificationComponent,
    ResetPasswordComponent,
    SendEmailComponent,
    





  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterOutlet,
    HttpClientModule,
    HomeLayoutModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    UserLayoutModule,


  ],
 providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
