import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private _isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this._isLoading.asObservable();

  private requestCount = 0;

show() {

  this.requestCount++;
  this._isLoading.next(true);
}

hide() {
  this.requestCount--;


  if (this.requestCount <= 0) {
    this.requestCount = 0;
    this._isLoading.next(false);
  }
}

}
