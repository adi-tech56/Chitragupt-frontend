// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SidebarComponent } from '../common/sidebar/sidebar.component';

import { DailyMedicinesComponent } from '../common/daily-medicines/daily-medicines.component';
import { RouterModule } from '@angular/router';

import { ExportFhirDataComponent } from '../common/export-fhir-data/export-fhir-data.component';
import { SharePrescriptionComponent } from '../common/share-prescription/share-prescription.component';
import { ViewSharedPrescriptionComponent } from '../common/view-shared-prescription/view-shared-prescription.component';
import {ErrorTooltipDirective} from './Directives/form-error-tooltip.directive'
import { ViewPrescriptionComponent } from '../common/view-prescription/view-prescription.component';
@NgModule({
  declarations: [
    SidebarComponent,
    DailyMedicinesComponent,
    ExportFhirDataComponent,
    SharePrescriptionComponent,
    ViewSharedPrescriptionComponent,
    ErrorTooltipDirective,
    ViewPrescriptionComponent,
    
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [
    SidebarComponent,
    DailyMedicinesComponent,
    SharePrescriptionComponent,
    ViewSharedPrescriptionComponent,
    
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ErrorTooltipDirective
  ],
})
export class SharedModule {}
