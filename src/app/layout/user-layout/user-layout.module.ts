import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { UserLayoutComponent } from './user-layout.component';
import { SidebarComponent } from 'src/app/common/sidebar/sidebar.component';
import { PatientDetailsComponent } from '../../common/forms/patient-details/patient-details.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';
import { FormsModule } from '@angular/forms';
import { PatientContactDetailsComponent } from 'src/app/common/forms/patient-contact-details/patient-contact-details.component';
import { PatientAllergyComponent } from 'src/app/common/forms/patient-allergy/patient-allergy.component';
import { HeaderComponent } from 'src/app/common/header/header.component';
import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';

@NgModule({
  declarations: [
    UserLayoutComponent,
    SidebarComponent,
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
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class UserLayoutModule {}
