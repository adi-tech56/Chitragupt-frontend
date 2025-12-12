import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth-service.service';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.css'],
})
export class GoogleCallbackComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Call backend to check session and update frontend state
    this.auth.checkAuthStatus().subscribe((res) => {
      if (res.authenticated) {
        // Redirect to user dashboard or home page
        this.router.navigate(['/user']);
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }
}
