import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';
import { AddMedicationComponent } from 'src/app/common/forms/add-medication/add-medication.component';
import { AuthGuard } from 'src/app/core/Gaurds/auth.guard';
import { RoleGuard } from 'src/app/core/Gaurds/role.guard';
import { MedicationPageComponent } from 'src/app/common/user/medication-page/medication-page.component';
import { ViewPrescriptionComponent } from 'src/app/common/view-prescription/view-prescription.component';
import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';
const routes: Routes = [
  {
    path: "",
    component: UserLayoutComponent,
    children: [
      { path: "", component: HomePageComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
           { path: 'profile', component: ProfilePageComponent },
      { path: 'emergencyContact', component: ContactPageComponent },
      { path: 'allergyForm', component: AllergyFormsComponent },
      { path: "add-medication", component: AddMedicationComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
      // { path: "medications", component: MedicationPageComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
      // { path: "view-prescription", component: ViewPrescriptionComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } }
      {
        path: "medications",
        loadChildren: () =>
          import("../medication-layout/medication-layout.module").then((m) => m.MedicationLayoutModule),
        canActivate: [AuthGuard, RoleGuard],

        data: { roles: ['PATIENT'] }
      }
    ],

// =======
// import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
// import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
// import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';

// const routes: Routes = [
//   {
//     path: '',
//     component: UserLayoutComponent,
//     children: [
//       { path: '', component: HomePageComponent },
//       { path: 'profile', component: ProfilePageComponent },
//       { path: 'emergencyContact', component: ContactPageComponent },
//       { path: 'allergyForm', component: AllergyFormsComponent },
//     ],
// >>>>>>> src/app/layout/user-layout/user-layout-routing.module.ts
//   },
// ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserLayoutRoutingModule {}
