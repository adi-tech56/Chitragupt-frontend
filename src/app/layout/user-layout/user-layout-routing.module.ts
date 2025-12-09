import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';

import { AuthGuard } from 'src/app/core/Gaurds/auth.guard';
import { RoleGuard } from 'src/app/core/Gaurds/role.guard';
import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';

import { SharePrescriptionComponent } from 'src/app/common/share-prescription/share-prescription.component';
import { ViewSharedPrescriptionComponent } from 'src/app/common/view-shared-prescription/view-shared-prescription.component';
import { AddUpdatePrescriptionComponent } from 'src/app/common/forms/add-update-prescription/add-update-prescription.component';
import { AllergyListComponent } from 'src/app/common/user/allergy-list/allergy-list.component';
const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['PATIENT'] },
      },
      { path: 'profile', component: ProfilePageComponent },
      { path: 'emergencyContact', component: ContactPageComponent },
      { path: 'allergyForm', component: AllergyFormsComponent },
      { path: 'allergyForm/:id', component: AllergyFormsComponent },
      { path: 'allergyList', component: AllergyListComponent },
    
      {
        path: 'medication',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['PATIENT'] },
        children: [
          {
            path: 'add',
            component: AddUpdatePrescriptionComponent,
          },
          {
            path: 'update/:id',
            component: AddUpdatePrescriptionComponent,
          },
        ],
      },
     
      // { path: "medications", component: MedicationPageComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } },
      // { path: "view-prescription", component: ViewPrescriptionComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['PATIENT'] } }
      {
        path: 'sharePrescription',
        component: SharePrescriptionComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['PATIENT'] },
      },
      {
        path: 'viewsharePrescription/:id',
        component: ViewSharedPrescriptionComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['PATIENT'] },
      },
      {
        path: 'medications',
        loadChildren: () =>
          import('../medication-layout/medication-layout.module').then(
            (m) => m.MedicationLayoutModule
          ),
        canActivate: [AuthGuard, RoleGuard],

        data: { roles: ['PATIENT'] },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserLayoutRoutingModule {}
