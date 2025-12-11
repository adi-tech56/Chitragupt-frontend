import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles: string[] = route.data['roles']; // roles defined in route
    const userRoles = this.authService.getUserRoles();
    console.log(userRoles)

    const hasRole = expectedRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      this.router.navigate(['/auth']);
      return false;
    }

    return true;
  }
}
