import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicationLayoutRoutingModule } from './medication-layout-routing.module';
import { MedicationLayoutComponent } from './medication-layout.component';
import { MedicationPageComponent } from 'src/app/common/user/medication-page/medication-page.component';
import { ViewPrescriptionComponent } from 'src/app/common/view-prescription/view-prescription.component';


@NgModule({
  declarations: [
    MedicationLayoutComponent,
    MedicationPageComponent,
    ViewPrescriptionComponent,
  ],
  imports: [
    CommonModule,
    MedicationLayoutRoutingModule
  ]
})
export class MedicationLayoutModule { }
