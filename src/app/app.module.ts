// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { LoginComponent } from './common/Authentication/login/login.component';
import { RegisterComponent } from './common/Authentication/register/register.component';
import { AuthLayoutComponent } from './common/Authentication/auth-layout/auth-layout.component';
import { VerificationComponent } from './common/Authentication/verification/verification.component';
import { ResetPasswordComponent } from './common/Authentication/reset-password/reset-password.component';
import { SendEmailComponent } from './common/Authentication/send-email/send-email.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeLayoutModule } from './layout/home-layout/home-layout.module';
import { UserLayoutModule } from './layout/user-layout/user-layout.module';

import { AuthInterceptor } from './core/Interceptors/auth-interceptor';



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
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HomeLayoutModule,
    UserLayoutModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
