import { Injectable } from '@angular/core';
import { AuthService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService {
  private intervalId: any;
  private REFRESH_INTERVAL_MS =  5 * 60 * 1000;// Check every 5 minutes

  constructor(private auth: AuthService) { }

  startAutoRefresh() {
     if (this.intervalId) return;
    this.stopAutoRefresh();
    console.log("Auto refresh started");

    this.intervalId = setInterval(() => {
      // Call backend to refresh token if refresh cookie exists
      this.auth.refresh().subscribe({
        next: (success) => {
          if (success) {
            console.log('Token refreshed successfully');
          } else {
            console.warn('Refresh failed → logging out');
            this.auth.logout();
          }
        },
        error: (err) => {
          console.error('Error during refresh → logging out', err);
          this.auth.logout();
        }
      });
    }, this.REFRESH_INTERVAL_MS);
  }

  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Auto refresh stopped");
    }
  }
}
