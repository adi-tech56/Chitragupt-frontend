import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from './user-layout.component';
import { HomePageComponent } from 'src/app/common/user/home-page/home-page.component';

const routes: Routes = [
   {
    path: "",
    component: UserLayoutComponent,
    children: [{ path: "", component: HomePageComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserLayoutRoutingModule { }
