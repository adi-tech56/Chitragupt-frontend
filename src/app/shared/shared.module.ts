// src/app/shared/shared.module.ts
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SidebarComponent } from "../common/sidebar/sidebar.component";
import { AddMedicationComponent } from "../common/forms/add-medication/add-medication.component";
import { DailyMedicinesComponent } from "../common/daily-medicines/daily-medicines.component";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [
    SidebarComponent,
    AddMedicationComponent,
    DailyMedicinesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
      RouterModule  
  ],
  exports: [
    SidebarComponent,
    AddMedicationComponent,
    DailyMedicinesComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
      RouterModule  
  ]
})
export class SharedModule { }
