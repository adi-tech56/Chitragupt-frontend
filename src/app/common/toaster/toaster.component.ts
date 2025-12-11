import { Component } from '@angular/core';
import { ToastMessage, ToastService } from 'src/app/core/Services/toast.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.css']
})
export class ToasterComponent {

  toasts: ToastMessage[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toastState.subscribe(toast => {
      this.toasts.push(toast);

      setTimeout(() => {
        this.toasts.shift();
      }, 3000); 
    });
  }
}
