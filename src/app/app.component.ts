import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from "@angular/router";
import { AuthService } from './core/Services/auth-service.service';
import { TokenRefreshService } from './core/Services/token-refresh.service';
import { LoaderService } from './core/Services/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {
  title = 'chitragupt';
  constructor(
    private auth: AuthService,
    private tokenRefresh: TokenRefreshService,
    private router: Router,
    public loaderService: LoaderService,
    private cdr: ChangeDetectorRef
  ) { }
  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.tokenRefresh.startAutoRefresh();
      console.log("Auto reffresh login ")
    }
   this.router.events.subscribe(event => {
  if (event instanceof NavigationStart) {
    setTimeout(() => this.loaderService.show());
  }

  if (
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError
  ) {
    setTimeout(() => this.loaderService.hide());
  }
});


  }
}
