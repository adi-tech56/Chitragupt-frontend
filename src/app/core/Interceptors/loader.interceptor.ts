import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../Services/loader.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  constructor(private loaderService: LoaderService) {}

 intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  if (req.headers.has('skipLoader')) {
      const newReq = req.clone({
        headers: req.headers.delete('skipLoader')
      });
      return next.handle(newReq);   
    }
  this.loaderService.show();

  return next.handle(req).pipe(
    finalize(() => {
  
      this.loaderService.hide();
    })
  );
}

}
