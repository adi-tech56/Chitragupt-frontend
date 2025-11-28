import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { AuthService } from './core/Services/auth-service.service';
import { TokenRefreshService } from './core/Services/token-refresh.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit{
  title = 'chitragupt';
  constructor(
    private auth: AuthService,
    private tokenRefresh: TokenRefreshService
  ) {}
   ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.tokenRefresh.startAutoRefresh();
      console.log("Auto reffresh login ")
    }
  }
}
