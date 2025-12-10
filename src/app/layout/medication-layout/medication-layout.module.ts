import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicationLayoutRoutingModule } from './medication-layout-routing.module';
import { MedicationLayoutComponent } from './medication-layout.component';
import { MedicationPageComponent } from 'src/app/common/user/medication-page/medication-page.component';

import { SharedModule } from "src/app/shared/shared.module";


@NgModule({
  declarations: [
    MedicationLayoutComponent,
    MedicationPageComponent,
    
  ],
  imports: [
    CommonModule,
    MedicationLayoutRoutingModule,
    SharedModule
]
})
export class MedicationLayoutModule { }
