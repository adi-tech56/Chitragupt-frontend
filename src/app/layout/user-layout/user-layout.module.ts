import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './user-layout-routing.module';
import { UserLayoutComponent } from './user-layout.component';
import { SidebarComponent } from 'src/app/common/sidebar/sidebar.component';


@NgModule({
  declarations: [
    UserLayoutComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    UserLayoutRoutingModule,
    
  ]
})
export class UserLayoutModule { }
