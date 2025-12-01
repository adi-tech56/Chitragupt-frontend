import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, switchMap, timer, of } from 'rxjs';
import { MedicationService } from './medication-service';
import { MedicationWithStatus, PatientMedicationLogs } from 'src/app/core/Models/Medication';

@Injectable({ providedIn: 'root' })
export class DailyMedicationService implements OnDestroy {

  private todaysMedsSubject = new BehaviorSubject<MedicationWithStatus[]>([]);
  public todaysMeds$ = this.todaysMedsSubject.asObservable();

  private autoSkipSub: Subscription | null = null;
  private loadSub: Subscription | null = null;

  constructor(private medicationService: MedicationService) {
    this.loadMeds();
    this.startAutoSkip();
  }
  loadMeds() {
    if (this.loadSub) this.loadSub.unsubscribe();

    this.loadSub = this.medicationService.getMedications()
      .pipe(
        switchMap(meds => {
          // Convert normalized → MedicationWithStatus
          const normalized: MedicationWithStatus[] = meds.map(m => ({
            ...m,
            taken: false,
            status: 'PENDING',
            doseTime: undefined,
            logCreatedAt: undefined
          }));

          return this.medicationService.getTodaysLogs().pipe(
            switchMap(logs => {
              const doses = this.applyLogsToMeds(normalized, logs);
              this.todaysMedsSubject.next(doses);
              return of(null);
            })
          );
        })
      )
      .subscribe();
  }

  // ----------------------------------------------
  private applyLogsToMeds(meds: MedicationWithStatus[], logs: PatientMedicationLogs[]): MedicationWithStatus[] {
    const todays: MedicationWithStatus[] = [];

    meds.forEach(med => {
      const doses = this.generateDosesForToday(med);

      doses.forEach(dose => {
        const log = logs.find(l =>
          l.superPrescriptionId === med.prescriptionId &&
          l.prescriptionId === med.prescriptionConditionId &&
          l.statementId === med.statementId &&
          l.doseTime &&
          new Date(l.doseTime).getTime() === dose.doseTime?.getTime()
        );

        if (log) {
          dose.taken = log.taken;
          dose.status = log.taken ? 'TAKEN' : 'SKIPPED';
          dose.logCreatedAt = new Date(log.doseTime!);
        }
      });

      todays.push(...doses);
    });

    return todays.sort((a, b) =>
      (a.doseTime?.getTime() ?? 0) - (b.doseTime?.getTime() ?? 0)
    );
  }
  private generateDosesForToday(med: MedicationWithStatus): MedicationWithStatus[] {
    if (!med.timing?.frequency || !med.timing.period || !med.timing.periodUnit) return [];

    const doses: MedicationWithStatus[] = [];

    const frequency = med.timing.frequency;
    const period = med.timing.period;
    const unit = med.timing.periodUnit.toLowerCase();

    // Today window boundaries
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const startDate = new Date(med.effectiveStartDate);
    const endDate = new Date(med.effectiveEndDate);

    // If both dates are same day → expand to full day
    if (startDate.toDateString() === endDate.toDateString()) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Convert period window → milliseconds
    let periodMs = 0;

    switch (unit) {
      case 'second': periodMs = period * 1000; break;
      case 'minute': periodMs = period * 60 * 1000; break;
      case 'hour': periodMs = period * 60 * 60 * 1000; break;
      case 'day': periodMs = period * 24 * 60 * 60 * 1000; break;
      case 'week': periodMs = period * 7 * 24 * 60 * 60 * 1000; break;
      case 'month': periodMs = period * 30 * 24 * 60 * 60 * 1000; break; // approx
      case 'year': periodMs = period * 365 * 24 * 60 * 60 * 1000; break;
      default: periodMs = period * 24 * 60 * 60 * 1000;
    }

    // Interval = window / frequency
    const intervalMs = frequency > 1 ? periodMs / (frequency - 1) : 0;


    // Extract base time (timeOfDay)
    let hours = 0, minutes = 0, seconds = 0;
    if (med.timing.timeOfDay) {
      [hours, minutes, seconds] = med.timing.timeOfDay.split(':').map(Number);
    }

    // FIRST DOSE = start date + timeOfDay
    let doseTime = new Date(startDate);
    doseTime.setHours(hours, minutes, seconds || 0, 0);

    // Move doseTime backwards if startDate > today
    if (doseTime > todayEnd) return [];

    while (doseTime.getTime() < todayStart.getTime() - periodMs) {
      doseTime = new Date(doseTime.getTime() + intervalMs);
    }


    // Generate doses until beyond today
    while (doseTime <= todayEnd && doseTime <= endDate) {
      if (doseTime >= todayStart) {
        doses.push({
          ...med,
          doseTime: new Date(doseTime),
          status: 'PENDING',
          taken: false
        });
      }
      doseTime = new Date(doseTime.getTime() + intervalMs);
    }
console.log(doses)
   return doses.sort((a, b) => (a.doseTime?.getTime() ?? 0) - (b.doseTime?.getTime() ?? 0));
  }

  // private generateDosesForToday(med: MedicationWithStatus): MedicationWithStatus[] {
  //   if (!med.timing?.frequency || !med.timing.period || !med.timing.periodUnit) return [];

  //   const doses: MedicationWithStatus[] = [];
  //   const now = new Date();
  //   const todayStart = new Date(now.setHours(0, 0, 0, 0));
  //   const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  //   const startDate = new Date(med.effectiveStartDate);
  //   const endDate = new Date(med.effectiveEndDate);

  //   const frequency = med.timing.frequency;
  //   const period = med.timing.period;
  //   const unit = med.timing.periodUnit.toLowerCase();

  //   // Convert period & unit to interval in milliseconds
  //   let intervalMs: number;
  //   switch (unit) {
  //     case 'day':
  //       intervalMs = period * 24 * 60 * 60 * 1000 / frequency; // divide day evenly
  //       break;
  //     case 'hour':
  //       intervalMs = period * 60 * 60 * 1000;
  //       break;
  //     case 'minute':
  //       intervalMs = period * 60 * 1000;
  //       break;
  //     case 'second':
  //       intervalMs = period * 1000;
  //       break;
  //     default:
  //       intervalMs = period * 60 * 60 * 1000;
  //   }

  //   // Set first dose time
  //   let hours = 0, minutes = 0, seconds = 0;
  //   if (med.timing.timeOfDay) {
  //     [hours, minutes, seconds] = med.timing.timeOfDay.split(':').map(Number);
  //   }

  //   let firstDose = new Date(todayStart);
  //   firstDose.setHours(hours, minutes, seconds || 0, 0);

  //   // Generate all doses for today
  //   for (let i = 0; i < frequency; i++) {
  //     const doseTime = new Date(firstDose.getTime() + i * intervalMs);

  //     // Only include doses that fall within today AND prescription period
  //     if (doseTime >= todayStart && doseTime <= todayEnd &&
  //         doseTime >= startDate && doseTime <= endDate) {
  //       doses.push({
  //         ...med,
  //         doseTime,
  //         status: 'PENDING',
  //         taken: false
  //       });
  //     }
  //   }
  // console.log(doses)
  //   return doses.sort((a, b) => (a.doseTime?.getTime() ?? 0) - (b.doseTime?.getTime() ?? 0));
  // }


  // ----------------------------------------------
  // MARK TAKEN
  // ----------------------------------------------
  markTaken(med: MedicationWithStatus) {
    if (!med.doseTime) return;

    const dose = this.formatLocalDateTime(med.doseTime);

    this.medicationService.markMedication(
      med.prescriptionId,
      med.prescriptionConditionId,
      med.statementId,
      true,
      dose
    ).subscribe(log => {
      med.taken = true;
      med.status = 'TAKEN';
      med.logCreatedAt = new Date(log.doseTime ?? log.createdAt);
      this.updateState();
    });
  }

  // ----------------------------------------------
  // AUTO SKIP LOOP
  // ----------------------------------------------
  startAutoSkip() {
    this.autoSkipSub = timer(0, 60000).subscribe(() => {
      const meds = this.todaysMedsSubject.value;
      const now = new Date();

      meds.forEach(med => {
        if (!med.doseTime || med.status !== 'PENDING') return;

        const cutoff = new Date(med.doseTime.getTime() + 3600000);

        if (now > cutoff && !med.logCreatedAt) {
          const dose = this.formatLocalDateTime(med.doseTime);

          this.medicationService.markMedication(
            med.prescriptionId,
            med.prescriptionConditionId,
            med.statementId,
            false,
            dose
          ).subscribe(() => {
            med.status = 'SKIPPED';
            med.taken = false;
            med.logCreatedAt = new Date();
            this.updateState();
          });
        }
      });
    });
  }

  private updateState() {
    this.todaysMedsSubject.next([...this.todaysMedsSubject.value]);
  }

  private formatLocalDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  ngOnDestroy() {
    this.autoSkipSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }
}
