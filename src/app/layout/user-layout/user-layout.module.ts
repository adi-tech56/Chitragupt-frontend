// src/app/layout/user-layout/user-layout.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { UserLayoutComponent } from './user-layout.component';
import { PatientDetailsComponent } from '../../common/forms/patient-details/patient-details.component';
import { PatientContactDetailsComponent } from '../../common/forms/patient-contact-details/patient-contact-details.component';
import { HomePageComponent } from '../../common/user/home-page/home-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module'; // ⬅ IMPORTANT
import { SidebarComponent } from 'src/app/common/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { PatientAllergyComponent } from 'src/app/common/forms/patient-allergy/patient-allergy.component';
import { HeaderComponent } from 'src/app/common/header/header.component';
import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    UserLayoutComponent,
    PatientDetailsComponent,
    PatientContactDetailsComponent,
    HomePageComponent,
    PatientAllergyComponent,
    HeaderComponent,
    ProfilePageComponent,
    ContactPageComponent,
    AllergyFormsComponent,
  ],
  imports: [
    CommonModule,
    UserLayoutRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [DatePipe],
})
export class UserLayoutModule {}
