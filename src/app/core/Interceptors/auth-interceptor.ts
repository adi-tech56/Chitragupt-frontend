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


    const publicEndpoints = [
      '/login',
      '/signup',
      '/verify-otp',
      '/send-password-link',
      '/update-password'
    ];

 
    if (publicEndpoints.some(url => req.url.includes(url))) {
      return next.handle(req.clone({ withCredentials: true }));
    }


    const cloned = req.clone({
      withCredentials: true
    });

    return next.handle(cloned);
  }
}
