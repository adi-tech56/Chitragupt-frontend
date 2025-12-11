import { Injectable } from '@angular/core';
import { AuthService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private intervalId: any;
  private REFRESH_THRESHOLD_MS = 60 * 1000; // 1 min before expiry

  constructor(private auth: AuthService) { }

  startAutoRefresh() {
    this.stopAutoRefresh();
    console.log("Auto refresh started");

    this.intervalId = setInterval(() => {
      const accessToken = this.auth.getToken();
      const now = Date.now();

      if (accessToken) {
        const decoded = this.auth.decodeToken(accessToken);
        const expiry = decoded?.exp ? decoded.exp * 1000 : 0;

        if (now >= expiry) {
          console.log('Access token expired → refreshing');
          this.callRefresh();
        } else if (expiry - now <= this.REFRESH_THRESHOLD_MS) {
          console.log('Access token close to expiry → refreshing');
          this.callRefresh();
        } else {
          console.log('Access token valid → no action needed');
        }

      } else {
        console.log('No access token → refreshing (if refresh cookie exists)');
        this.callRefresh();
      }

    },30 * 1000);
  }

  private callRefresh() {
    this.auth.refresh().subscribe({
      next: (res) => console.log('Token refreshed successfully'),
      error: (err) => {
        console.warn('Refresh failed → logging out', err);
        this.auth.logout();
      }
    });
  }

  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
