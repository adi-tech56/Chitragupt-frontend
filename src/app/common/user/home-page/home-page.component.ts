import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {

  hasPrescriptions = false;
  private destroy$ = new Subject<void>();
  isHomeLoading: boolean = true;

  constructor(private medicationService: MedicationService) {}

ngOnInit(): void {
  this.isHomeLoading = true;

  this.medicationService.checkPrescriptionExists()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: exists => {
        this.hasPrescriptions = exists;
        this.isHomeLoading = false;
      },
      error: () => {
        this.hasPrescriptions = false;
        this.isHomeLoading = false;
      }
    });
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
