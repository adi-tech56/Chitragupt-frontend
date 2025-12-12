import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './common/Authentication/login/login.component';
import { AuthLayoutComponent } from './common/Authentication/auth-layout/auth-layout.component';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { ResetPasswordComponent } from './common/Authentication/reset-password/reset-password.component';
import { AuthGuard } from './core/Gaurds/auth.guard';
import { RoleGuard } from './core/Gaurds/role.guard';
import { GuestGuard } from './core/Gaurds/guest-guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    // canActivate: [GuestGaurd],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [GuestGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./layout/user-layout/user-layout.module').then(
        (m) => m.UserLayoutModule
      ),
    canActivate: [AuthGuard, RoleGuard],

    data: { roles: ['PATIENT'] },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
