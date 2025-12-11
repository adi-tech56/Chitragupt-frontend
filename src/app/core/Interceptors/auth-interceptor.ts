import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../Services/auth-service.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    const token = this.authService.getToken();

    if (
      req.url.includes('/login') ||
      req.url.includes('/signup') ||
      req.url.includes('/verify-otp') ||
      req.url.includes('/send-password-link') ||
      req.url.includes('/update-password')
    ) {
      return next.handle(req);
    }


    if (token) {
      if (this.authService.isTokenExpired(token)) {
        console.warn("Token expired, logging out");
        this.authService.logout();
        return next.handle(req);
      }

      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        },
        
        withCredentials: true
      });

      return next.handle(cloned);
    }

    return next.handle(req);
  }
}
