// src/app/layout/user-layout/user-layout.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { UserLayoutComponent } from './user-layout.component';

import { PatientDetailsComponent } from '../../common/forms/patient-details/patient-details.component';
import { PatientContactDetailsComponent } from '../../common/forms/patient-contact-details/patient-contact-details.component';
import { HomePageComponent } from '../../common/user/home-page/home-page.component';

import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';  // ⬅ IMPORTANT

@NgModule({
  declarations: [
    UserLayoutComponent,
    PatientDetailsComponent,
    PatientContactDetailsComponent,
    HomePageComponent,
  ],
  imports: [
    CommonModule,
    UserLayoutRoutingModule,
    ReactiveFormsModule,
    SharedModule   // ✔ Sidebar, DailyMedicines, AddMedication available now
  ]
})
export class UserLayoutModule { }
