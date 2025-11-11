import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './common/Authentication/login/login.component';
import { RegisterComponent } from './common/Authentication/register/register.component';

import { RouterOutlet } from '@angular/router';
import { HomeLayoutModule } from './layout/home-layout/home-layout.module';
import { AuthLayoutComponent } from './common/Authentication/auth-layout/auth-layout.component';
import { PatientDetailsComponent } from './common/Authentication/patient-details/patient-details.component';
import { VerificationComponent } from './common/Authentication/verification/verification.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { UserLayoutModule } from './layout/user-layout/user-layout.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    AuthLayoutComponent,
    PatientDetailsComponent,
    VerificationComponent,
   
  
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterOutlet,
    HomeLayoutModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    UserLayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
