import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserLoginDetails, UserRegisterDetails } from '../Models/Authentication';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {}
  verifyOtp(payload: { email: any; otp: any }) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8089/auth';
  private http = inject(HttpClient);
  private cookieService = inject(CookieService);

  getToken(): string | null {
    const token = this.cookieService.get('accessToken');

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
  // refresh() {
  //   return this.http.get(`${this.apiUrl}/refresh`, {
  //     withCredentials: true
  //   });
  // }

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
    console.log(userLogin);
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
    console.log(userRegister);
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
    console.log(data);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/verify-otp`, data, { headers });
  }

  resetPassword(data: string): Observable<any> {
    console.log(data);
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
    console.log(data);
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
  logout(): void {
    this.cookieService.delete('accessToken', '/');
    this.cookieService.delete('refreshToken', '/');

    // Optional: Clear all local data
    localStorage.clear();
    sessionStorage.clear();

    // Navigate to login/auth page
    this.router.navigate(['/auth']);
  }
}
