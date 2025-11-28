// import { inject, Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from '../Services/auth-service.service';
// import { Observable, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthGuard implements CanActivate {

//   private auth = inject(AuthService);
//   private router = inject(Router);
//   canActivate(): Observable<boolean> {

//     const token = this.auth.getToken();

//     if (!token || this.auth.isTokenExpired(token)) {

//       return this.auth.refresh().pipe(
//         map(() => {

//           const newToken = this.auth.getToken();

//           if (newToken && !this.auth.isTokenExpired(newToken)) {
//             console.log("Refresh successful → cookie now available");
//             return true;
//           }

//           console.log("Refresh failed → redirecting");
//           this.router.navigate(['auth']);
//           return false;

//         }),
//         catchError(() => {
//           this.router.navigate(['auth']);
//           return of(false);
//         })
//       );
//     }

//     // Token is valid
//     return of(true);
//   }

// }
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired(token)) {
      this.router.navigate(['/auth']);
      return false;
    }
    return true;
  }
}
