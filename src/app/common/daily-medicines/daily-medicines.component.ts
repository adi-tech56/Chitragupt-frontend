
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MedicationWithStatus } from 'src/app/core/Models/Medication';
import { PaginationState } from 'src/app/core/Models/Pagination';
import { DailyMedicationService } from '../../core/Services/PrescriptionServices/daily-medication.service'
import { getTotalPages, paginate } from 'src/app/shared/pagination.helper';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-daily-medicines',
  templateUrl: './daily-medicines.component.html',
  styleUrls: ['./daily-medicines.component.css']
})
export class DailyMedicinesComponent implements OnInit, OnDestroy {
  @Input() pageContext: 'HOME' | 'MEDICATION' = 'MEDICATION';
  private medsSubscription!: Subscription;
  todaysMeds: MedicationWithStatus[] = [];
  viewMode: 'TODAY' | 'SKIPPED' | 'COMPLETED' = 'TODAY';
  skippedPagination: PaginationState = { page: 1, pageSize: 4 };
  completedPagination: PaginationState = { page: 1, pageSize: 4 };

  constructor(private state: DailyMedicationService) { }
  openIndex: number | null = null;

  toggleAccordion(index: number) {
    if (this.openIndex === index) {
      this.openIndex = null;
    } else {
      this.openIndex = index;
    }
  }
  ngOnInit() {
    this.medsSubscription = this.state.todaysMeds$.subscribe(meds => {
      console.log(meds)
      this.todaysMeds = meds;
    });
  }

  ngOnDestroy() {
    // Unsubscribe when the component is destroyed
    if (this.medsSubscription) {
      this.medsSubscription.unsubscribe();
    }
  }
  setView(mode: 'TODAY' | 'SKIPPED' | 'COMPLETED') {
    this.viewMode = mode;
  }
  isWithinCompletionWindow(med: MedicationWithStatus): boolean {
 console.log('isWithinCompletionWindow called for:', med.medication, med.doseTime);
    if (!med.doseTime) return false;
    if (med.logCreatedAt) return false;
 
    console.log(med)
    const now = new Date();
    const windowEnd = new Date(med.doseTime.getTime() + 60 * 60 * 1000);
    console.log(windowEnd)
    return now >= med.doseTime && now <= windowEnd;
  }
  get activeMeds() {
    
    return this.todaysMeds.filter(m => m.takenStatus
      === 'PENDING');
  }
  get completedMeds() {
    return this.todaysMeds.filter(m => m.takenStatus
 === 'TAKEN');
  }
  get skippedMeds() {
    return this.todaysMeds.filter(m => m.takenStatus
 === 'SKIPPED');
  }

  markTaken(med: MedicationWithStatus) {
    this.state.markTaken(med);
  }

  get paginatedSkippedMeds() {
    return paginate(this.skippedMeds, this.skippedPagination);
  }

  get totalSkippedPages() {
    return getTotalPages(this.skippedMeds.length, this.skippedPagination.pageSize);
  }

  get paginatedCompletedMeds() {
    return paginate(this.completedMeds, this.completedPagination);
  }

  get totalCompletedPages() {
    return getTotalPages(this.completedMeds.length, this.completedPagination.pageSize);
  }
  setSkippedPage(page: number) {
    this.skippedPagination.page = page;
  }

  setCompletedPage(page: number) {
    this.completedPagination.page = page;
  }
}
