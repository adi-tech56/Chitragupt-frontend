import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../Services/auth-service.service';

@Injectable({ providedIn: 'root' })
export class GuestGaurd implements CanActivate {

    private router = inject(Router);

    private auth = inject(AuthService)

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const token = this.auth.getToken();

   

        if (!token) {
            return true;
        } else {
          
    const userRoles = this.auth.getUserRoles();
    console.log(userRoles)

  
            if (userRoles.includes("PATIENT")) {
                this.router.navigate(["/user"]);
                return true;
            }
            // if (userRoles.includes("ADMIN")) {
            //     this.router.navigate(["/admin-dashboard"]);
            // }
        }
        // this.router.navigate(["/login"]);
        return true;
    }

}