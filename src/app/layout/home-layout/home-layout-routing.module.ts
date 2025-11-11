import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeLayoutComponent } from './home-layout.component';
import { HomePageComponent } from 'src/app/common/home-page/home-page.component';


const routes: Routes = [
  {
    path: "",
    component: HomeLayoutComponent,
    children: [{ path: "", component: HomePageComponent}],
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeLayoutRoutingModule { }
