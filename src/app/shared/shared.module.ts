// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SidebarComponent } from '../common/sidebar/sidebar.component';
import { AddMedicationComponent } from '../common/forms/add-medication/add-medication.component';
import { DailyMedicinesComponent } from '../common/daily-medicines/daily-medicines.component';
import { RouterModule } from '@angular/router';
import { UpdatePrescriptionComponent } from '../common/forms/update-prescription/update-prescription.component';
import { ExportFhirDataComponent } from '../common/export-fhir-data/export-fhir-data.component';
import { SharePrescriptionComponent } from '../common/share-prescription/share-prescription.component';
import { ViewSharedPrescriptionComponent } from '../common/view-shared-prescription/view-shared-prescription.component';
import {ErrorTooltipDirective} from './Directives/form-error-tooltip.directive'
@NgModule({
  declarations: [
    SidebarComponent,
    AddMedicationComponent,
    DailyMedicinesComponent,
    UpdatePrescriptionComponent,
    ExportFhirDataComponent,
    SharePrescriptionComponent,
    ViewSharedPrescriptionComponent,
    ErrorTooltipDirective
    
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [
    SidebarComponent,
    AddMedicationComponent,
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
