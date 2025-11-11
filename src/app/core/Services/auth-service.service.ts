import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserLoginDetails } from '../Models/Authentication';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  login(userDetails: UserLoginDetails):any {
    console.log(userDetails);
   
  }
  resetPassword(userName: string) {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}
