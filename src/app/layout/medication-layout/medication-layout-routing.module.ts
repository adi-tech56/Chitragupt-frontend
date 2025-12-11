import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicationLayoutComponent } from './medication-layout.component';
import { MedicationPageComponent } from 'src/app/common/user/medication-page/medication-page.component';
import { AuthGuard } from 'src/app/core/Gaurds/auth.guard';
import { RoleGuard } from 'src/app/core/Gaurds/role.guard';
import { ViewPrescriptionComponent } from 'src/app/common/view-prescription/view-prescription.component';
import { ExportFhirDataComponent } from 'src/app/common/export-fhir-data/export-fhir-data.component';



const routes: Routes = [
  {
    path: "",
    component: MedicationLayoutComponent,
    children: [
      { path: "", component: MedicationPageComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
      
      { path: "view-prescription", component: ViewPrescriptionComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
        { path: "export-fhir", component: ExportFhirDataComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } }
     
    ],

  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MedicationLayoutRoutingModule { }
