import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  UserLoginDetails,
  UserRegisterDetails,
} from '../Models/Authentication';
import { catchError, map, Observable, of, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { StateService } from './state-service.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'auth';
  private http = inject(HttpClient);
  // BehaviorSubject to store current user info
  private currentUserSubject = new BehaviorSubject<{
    userId?: number;
    userName?: string;
    role?: string[];
  }>({});

  constructor(private router: Router, private stateService: StateService) {
    this.stateService.register(this.currentUserSubject);
  }
  getGoogleOAuthUrl(): string {
    return `${environment.apiUrl}/oauth2/authorization/google`;
  }
  handleOAuthCallback(): Observable<any> {
    return this.checkAuthStatus();
  }

  /** Login **/
  login(userLogin: UserLoginDetails): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(
      `${this.apiUrl}/login`,
      {
        email: userLogin.userEmail,
        password: userLogin.passWord,
      },
      { withCredentials: true, headers }
    );
  }

  /** Check auth status and update current user info **/
  checkAuthStatus(): Observable<{
    authenticated: boolean;
    userId?: string;
    userName?: string;
    role?: string[];
  }> {
    return this.http
      .get<{
        authenticated: boolean;
        userId?: string;
        userName?: string;
        role?: string[];
      }>(`${this.apiUrl}/status`, { withCredentials: true })
      .pipe(
        map((res) => {
          if (res.authenticated) {
            this.currentUserSubject.next({
              userId: res.userId ? Number(res.userId) : undefined,
              userName: res.userName,
              role: res.role,
            });
          } else {
            this.currentUserSubject.next({});
          }
          return res;
        }),
        catchError(() => {
          this.currentUserSubject.next({});
          return of({ authenticated: false });
        })
      );
  }

  /** Refresh access token **/
  refresh(): Observable<boolean> {
    return this.http
      .get(`${this.apiUrl}/refresh`, { withCredentials: true })
      .pipe(
        map(() => true),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }

  /** Logout **/
  logout(): void {
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe(() => {});
    this.currentUserSubject.next({});
    this.stateService.clearAll();
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/auth']);
  }

  /** Signup **/
  signup(userRegister: UserRegisterDetails): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(
      `${this.apiUrl}/signup`,
      {
        firstName: userRegister.firstName,
        middleName: userRegister.middleName,
        lastName: userRegister.lastName,
        contactNumber: userRegister.contactNo,
        email: userRegister.email,
        password: userRegister.passWord,
        confirmPassword: userRegister.passWord,
      },
      { headers }
    );
  }

  /** Verify OTP **/
  verifyOTP(data: { email: string; otp: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, data);
  }

  /** Reset password **/
  resetPassword(data: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-password-link`, data);
  }

  /** Update password **/
  updatePassword(data: {
    password: string;
    confirmPassword: string;
    token: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-password`, data);
  }

  /** Get user info anywhere **/
  getUserName(): string {
    return this.currentUserSubject.value.userName || '';
  }

  getUserId(): number {
    return this.currentUserSubject.value.userId ?? 0;
  }

  getUserRoles(): string[] {
    return this.currentUserSubject.value.role || [];
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value.userId;
  }
}
