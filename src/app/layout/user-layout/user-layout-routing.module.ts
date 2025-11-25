import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';
import { AddMedicationComponent } from 'src/app/common/forms/add-medication/add-medication.component';
import { AuthGuard } from 'src/app/core/Gaurds/auth.guard';
import { RoleGuard } from 'src/app/core/Gaurds/role.guard';

const routes: Routes = [
  {
    path: "",
    component: UserLayoutComponent,
    children: [
      { path: "", component: HomePageComponent ,canActivate: [AuthGuard,RoleGuard], data: { roles: ['PATIENT'] }} ,
       { path: "add-medication", component: AddMedicationComponent,canActivate: [AuthGuard,RoleGuard], data: { roles: ['PATIENT'] } }
    ],

  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserLayoutRoutingModule { }
