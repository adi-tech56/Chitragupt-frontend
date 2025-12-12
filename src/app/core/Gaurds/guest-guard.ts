import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.auth.checkAuthStatus().pipe(
      map(status => {
        if (status.authenticated) {
          // Redirect based on role if already logged in
          const roles = status.role ?? [];
          if (roles.includes('PATIENT')) this.router.navigate(['/user']);
          else this.router.navigate(['/']); // default page
          return false;
        }
        return true; // allow guest access
      })
    );
  }
}
