import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';
import { ProfilePageComponent } from 'src/app/common/user/profile-page/profile-page.component';
import { ContactPageComponent } from 'src/app/common/user/contact-page/contact-page.component';
import { AllergyFormsComponent } from 'src/app/common/user/allergy-forms/allergy-forms.component';

const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'profile', component: ProfilePageComponent },
      { path: 'emergencyContact', component: ContactPageComponent },
      { path: 'allergyForm', component: AllergyFormsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserLayoutRoutingModule {}
