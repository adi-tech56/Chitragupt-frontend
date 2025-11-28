import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit,OnDestroy {
  hasPrescriptions: boolean = false;
  loading: boolean = true;
  constructor(private medicationService :MedicationService){}
 
   private destroy$ = new Subject<void>();
  ngOnInit(): void {
    this.medicationService.checkPrescriptionExists()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (exists) => {
        this.hasPrescriptions = exists;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.hasPrescriptions = false;
        this.loading = false;
      }
    });
  }

   ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}