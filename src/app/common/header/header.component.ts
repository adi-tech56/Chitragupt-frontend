import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth-service.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
   @Input() showProfileButton: boolean = true; // default true

  constructor(private router: Router, private auth: AuthService) {}

  goToProfile() {
    this.router.navigate(['/user/profile']);
  }

  logout() {
    this.auth.logout();
    window.location.reload();
    this.router.navigate(['/auth']);
  }
}
