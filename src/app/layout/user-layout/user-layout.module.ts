import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { UserLayoutComponent } from './user-layout.component';
import { SidebarComponent } from 'src/app/common/sidebar/sidebar.component';
import { PatientDetailsComponent } from '../../common/forms/patient-details/patient-details.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';
import { PatientContactDetailsComponent } from 'src/app/common/forms/patient-contact-details/patient-contact-details.component';
import { AddMedicationComponent } from 'src/app/common/forms/add-medication/add-medication.component';
import { MedicationPageComponent } from 'src/app/common/user/medication-page/medication-page.component';


@NgModule({
  declarations: [
    UserLayoutComponent,
    SidebarComponent,
    PatientDetailsComponent,
    PatientContactDetailsComponent,
    HomePageComponent,
    AddMedicationComponent,
    MedicationPageComponent
  ],
  imports: [
    CommonModule,
    UserLayoutRoutingModule,
     ReactiveFormsModule,
  ]
})
export class UserLayoutModule { }
