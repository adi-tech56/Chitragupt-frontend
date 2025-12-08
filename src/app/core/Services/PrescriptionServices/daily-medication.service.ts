import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, switchMap, timer, of } from 'rxjs';
import { MedicationService } from './medication-service';
import {
  MedicationWithStatus,
  PatientMedicationLogs,
} from 'src/app/core/Models/Medication';
import { DatePipe } from '@angular/common';
import { StateService } from '../state-service.service';

@Injectable({ providedIn: 'root' })
export class DailyMedicationService implements OnDestroy {
  private todaysMedsSubject = new BehaviorSubject<MedicationWithStatus[]>([]);
  public todaysMeds$ = this.todaysMedsSubject.asObservable();

  private autoSkipSub: Subscription | null = null;
  private loadSub: Subscription | null = null;

  constructor(
    private medicationService: MedicationService,
    private datePipe: DatePipe,
    private stateService:StateService 
  ) {
    this.stateService.register(this.todaysMedsSubject);
    this.loadMeds();
    this.startAutoSkip();
    this.startReminderCheck();
  }
clearState() {
  this.todaysMedsSubject.next([]);
}
loadMeds() {
  if (this.loadSub) this.loadSub.unsubscribe();

  this.loadSub = this.medicationService.getMedications()
    .subscribe((doses: MedicationWithStatus[]) => {
      
      doses.forEach(d => {
        if (d.doseTime) d.doseTime = new Date(d.doseTime);
        if (d.logCreatedAt) d.logCreatedAt = new Date(d.logCreatedAt);
      });

      // Sort by doseTime
      doses.sort((a, b) => (a.doseTime?.getTime() ?? 0) - (b.doseTime?.getTime() ?? 0));

      this.todaysMedsSubject.next(doses);
    });
}

refreshMeds() {
  this.loadMeds();
}

  //reminder for medicines check

  private isSameMinute(t1: Date, t2: Date): boolean {
    return (
      t1.getFullYear() === t2.getFullYear() &&
      t1.getMonth() === t2.getMonth() &&
      t1.getDate() === t2.getDate() &&
      t1.getHours() === t2.getHours() &&
      t1.getMinutes() === t2.getMinutes()
    );
  }

  startReminderCheck() {
    timer(0, 60000).subscribe(() => {
      // check every minute
      const now = new Date();
      const meds = this.todaysMedsSubject.value;

      meds.forEach((med) => {
        console.log(med)
        if (!med.doseTime || med.takenStatus !== 'PENDING') return;
        console.log('Reminder', med);
        const doseTime = med.doseTime;

        // Reminder 1 (5 minutes before)
        const reminder1 = new Date(doseTime.getTime() - 5 * 60000);

        // Reminder 2 (55 minutes after)
        const reminder2 = new Date(doseTime.getTime() + 55 * 60000);

        if (this.isSameMinute(now, reminder1)) {
          this.sendReminderToBackend(med, 1);
        }

        if (!med.taken && this.isSameMinute(now, reminder2)) {
          this.sendReminderToBackend(med, 2);
        }
      });
    });
  }

  sendReminderToBackend(med: MedicationWithStatus, type: number) {
    const formattedTime = this.datePipe.transform(med.doseTime, 'h:mm a');

    const payload = {
      superPrescriptionId: med.prescriptionId,
      medicationName: med.medication,
      doseTime: formattedTime, // send only time
      reminderType: type,
    };

    this.medicationService.sendReminder(payload).subscribe({
      next: () => {
        console.log('Reminder triggered:', payload);
      },
      error: (err) => {
        console.error('Reminder error:', err);
      },
    });
  }


  markTaken(med: MedicationWithStatus) {
    if (!med.doseTime) return;

    const dose = this.formatLocalDateTime(med.doseTime);

    this.medicationService
      .markMedication(
        med.prescriptionId,
        med.prescriptionConditionId,
        med.statementId,
        true,
        dose
      )
      .subscribe((log) => {
        med.taken = true;
        med.status = 'TAKEN';
        med.logCreatedAt = new Date(log.doseTime ?? log.createdAt);
        this.updateState();
      });
      this.refreshMeds();
  }

  // ----------------------------------------------
  // AUTO SKIP LOOP
  // ----------------------------------------------
  startAutoSkip() {
    this.autoSkipSub = timer(0, 60000).subscribe(() => {
      const meds = this.todaysMedsSubject.value;
      const now = new Date();

      meds.forEach((med) => {
        if (!med.doseTime || med.status !== 'PENDING') return;

        const cutoff = new Date(med.doseTime.getTime() + 3600000);

        if (now > cutoff && !med.logCreatedAt) {
          const dose = this.formatLocalDateTime(med.doseTime);

          this.medicationService
            .markMedication(
              med.prescriptionId,
              med.prescriptionConditionId,
              med.statementId,
              false,
              dose
            )
            .subscribe(() => {
              med.status = 'SKIPPED';
              med.taken = false;
              med.logCreatedAt = new Date();
              this.updateState();
            });
        }
      });
    });

    this.refreshMeds();
  }

  private updateState() {
    this.todaysMedsSubject.next([...this.todaysMedsSubject.value]);
  }

  private formatLocalDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  ngOnDestroy() {
    this.autoSkipSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }
}
