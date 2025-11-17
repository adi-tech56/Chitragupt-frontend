import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    const token = this.auth.getToken();

  
    if (!token || this.auth.isTokenExpired(token)) {
      return this.auth.refresh().pipe(
        map(success => {
          if (success) {
            return true; 
          } else {
            console.log("Navigate to auth")
            this.router.navigate(['auth']);
            return false;
          }
        }),
        catchError(() => {
          this.router.navigate(['auth']);
          return of(false);
        })
      );
    }


    return of(true);
  }
}
