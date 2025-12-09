import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'

@Injectable()
export class ApiBaseUrlInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
     if (req.url.startsWith('assets/')) {
      return next.handle(req);
    }

    // if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    //   return next.handle(req);
    // }
    const apiReq = req.clone({ url: `${environment.apiUrl}/${req.url}` });
    return next.handle(apiReq);
  }
}