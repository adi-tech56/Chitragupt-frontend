import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserLoginDetails, UserRegisterDetails } from '../Models/Authentication';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { StateService } from './state-service.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router,
    private stateService:StateService
  ) {}
  verifyOtp(payload: { email: any; otp: any }) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'auth';
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);

  getToken(): string | null {
    console.log(document.cookie);

    const token = this.cookieService.get('accessToken');
  console.log(token)
    return token ? token : null;
  }
  getRefreshToken(): string | null {
    const token = this.cookieService.get('refreshToken');

    return token ? token : null;
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }
  getUserName(): string {
    const token = this.getToken();
    if (!token) return '';
    const decoded = this.decodeToken(token);
    if (!decoded) return '';
    const userName = decoded.userName;
    return userName;
  }
  getUserId(): number {
    let token = this.getToken() ?? ''; // ensures token is always string

    const decoded = this.decodeToken(token) ?? '';

    return Number(decoded.userId);
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];

    const decoded = this.decodeToken(token);
    if (!decoded) return [];

    const roleMatches = decoded.role.match(/name=(\w+)/g);
    if (!roleMatches) return [];
    return roleMatches.map((r: string) => r.split('=')[1]);
  }
  

  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expiryDate = decoded.exp * 1000;
    return Date.now() > expiryDate;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
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
  verifyOTP(data: { email: string; otp: string }): Observable<any> {

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/verify-otp`, data, { headers });
  }

  resetPassword(data: string): Observable<any> {
   
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/send-password-link`, data, {
      headers,
    });
  }
  updatePassword(data: {
    password: string;
    confirmPassword: string;
    token: string;
  }): Observable<any> {

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/update-password`, data, { headers });
  }

 refresh(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/refresh`, { withCredentials: true }).pipe(
      map((res: any) => {
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  /** Logout **/
//  logout(): void {
//   const cookieDomain = '.inc1.devtunnels.ms';
//   const cookiePath = '/';

//   // Delete cookies with domain and path
//   this.cookieService.delete('accessToken', cookiePath, cookieDomain);
//   this.cookieService.delete('refreshToken', cookiePath, cookieDomain);

//   // Clear application state
//   this.stateService.clearAll();
//   localStorage.clear();
//   sessionStorage.clear();

//   // Redirect to login/auth page
//   this.router.navigate(['/auth']);
// }
logout(): void {
  const cookiePath = '/';

  // Delete cookies (no domain needed on localhost)
  this.cookieService.delete('accessToken', cookiePath);
  this.cookieService.delete('refreshToken', cookiePath);

  // Clear application state
  this.stateService.clearAll();
  localStorage.clear();
  sessionStorage.clear();

  // Redirect to login/auth page
  this.router.navigate(['/auth']);
}

}
