import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const expectedRoles: string[] = route.data['roles'];

    return this.auth.checkAuthStatus().pipe(
      map(status => {
        if (!status.authenticated) {
          this.router.navigate(['/auth']);
          return false;
        }

        const userRoles = status.role ?? [];
        const hasRole = expectedRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
          this.router.navigate(['/auth']);
          return false;
        }

        return true;
      })
    );
  }
}
