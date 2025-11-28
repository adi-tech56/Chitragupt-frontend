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

  // ----------------------------------------------
  // SAME generateDosesForToday FROM YOUR COMPONENT
  // ----------------------------------------------
  private generateDosesForToday(med: MedicationWithStatus): MedicationWithStatus[] {
    if (!med.timing?.timeOfDay || !med.timing.frequency) return [];

    const doses: MedicationWithStatus[] = [];
    const [hours, minutes, seconds] = med.timing.timeOfDay.split(':').map(Number);

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    let start = new Date(med.effectiveStartDate);
    let end = new Date(med.effectiveEndDate);

    if (start.toDateString() === end.toDateString()) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    let intervalMs = 0;
    const unit = med.timing.periodUnit.toLowerCase();

    if (unit === 'day') intervalMs = med.timing.period * 86400000;
    else if (unit === 'hour') intervalMs = med.timing.period * 3600000;
    else if (unit === 'minute') intervalMs = med.timing.period * 60000;
    else intervalMs = med.timing.period * 3600000;

    let firstDose = new Date();
    firstDose.setHours(hours, minutes, seconds || 0, 0);

    if (firstDose < start) {
      firstDose = new Date(start);
      firstDose.setHours(hours, minutes, seconds || 0, 0);
    }

    for (let i = 0; i < med.timing.frequency; i++) {
      const doseTime = new Date(firstDose.getTime() + i * intervalMs);

      if (doseTime >= todayStart && doseTime <= todayEnd && doseTime >= start && doseTime <= end) {
        doses.push({
          ...med,
          doseTime,
          status: 'PENDING',
          taken: false
        });
      }
    }
    return doses;
  }

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
