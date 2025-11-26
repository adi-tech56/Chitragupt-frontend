import { Component, OnInit } from '@angular/core';
import { MedicationService } from 'src/app/core/Services/medication-service';
import { MedicationNormalized, PatientMedicationLogs } from 'src/app/core/Models/Medication';

interface MedicationWithStatus extends MedicationNormalized {
  taken: boolean;
}

@Component({
  selector: 'app-medication-page',
  templateUrl: './medication-page.component.html',
  styleUrls: ['./medication-page.component.css']
})
export class MedicationPageComponent implements OnInit {

  allMeds: MedicationWithStatus[] = [];
  todaysMeds: MedicationWithStatus[] = [];

  constructor(private medicationService: MedicationService) {}

 ngOnInit() {
  console.log("MedicationPageComponent Initialized");

  // Fetch all prescriptions
  this.medicationService.getPrescriptions().subscribe(meds => {
    console.log(" All Prescriptions fetched:", meds);
    const medsWithStatus = meds.map(m => ({ ...m, taken: false, status: 'PENDING' }));
    this.allMeds = medsWithStatus;

    this.todaysMeds = this.getTodayMeds(medsWithStatus);
    console.log(" Today's Medications (initial):", this.todaysMeds);

    // Fetch today's logs to update taken status
    this.medicationService.getTodaysLogs().subscribe(logs => {
      console.log(" Today's Medication Logs fetched:", logs);

      logs.forEach(log => {
        // Find corresponding medication
        const match = this.allMeds.find(m =>
          m.prescriptionId === log.superPrescriptionId &&
          m.prescriptionConditionId === log.prescriptionId &&
          m.statementId === log.statementId
        );

        if (match) {
          if (log.taken === true) {
            match.taken = true;
            match.status = 'TAKEN';
            console.log(`✅ ${match.medication} marked as TAKEN`);
          } else if (log.taken === false) {
            match.taken = false;
            match.status = 'SKIPPED';
            console.log(`${match.medication} marked as SKIPPED`);
            console.log(match)
          }
        } else {
          console.log("No matching medication found for log:", log);
        }
      });

    });
  });

  setInterval(() => {
    console.log("⏱️ Running autoMarkSkipped check at:", new Date());
    this.autoMarkSkipped();
  }, 60 * 1000);
}

  private getTodayMeds(list: MedicationWithStatus[]): MedicationWithStatus[] {
    const now = new Date();
   

    return list
      .filter(med => {
        const start = new Date(med.effectiveStartDate);
        const end = new Date(med.effectiveEndDate);

        const isToday = now >= start && now <= end;
        return isToday;
      })
      .sort((a, b) => a.timing.timeOfDay.localeCompare(b.timing.timeOfDay));
  }
get activeMeds(): MedicationWithStatus[] {
  return this.todaysMeds.filter(m => m.status !== 'SKIPPED');
}

get skippedMeds(): MedicationWithStatus[] {
  return this.todaysMeds.filter(m => m.status === 'SKIPPED');
}

  markTaken(med: MedicationWithStatus) {

    this.medicationService.markMedication(
      med.prescriptionId,
      med.prescriptionConditionId,
      med.statementId,
      true
    ).subscribe({
      next: log => {
        console.log("Mark Taken Success:", log);
        med.taken = true;
      },
      error: err => console.error(" Error marking medication taken:", err)
    });
  }


autoMarkSkipped() {
  const now = new Date();
  console.log("Auto Skip Check Running at:", now);

  this.todaysMeds.forEach(med => {
    console.log(`Checking "${med.medication}" | Status: ${med.status}`);

    // Skip if already taken or already skipped
    if (med.status === 'TAKEN' || med.status === 'SKIPPED') {
      console.log(`Already handled: ${med.medication} (${med.status})`);
      return;
    }

    if (!med.timing?.timeOfDay) {
      console.log(`No timeOfDay set for ${med.medication}, skipping`);
      return;
    }

    const [hours, minutes, seconds] = med.timing.timeOfDay.split(':').map(Number);
    const medTime = new Date();
    medTime.setHours(hours, minutes, seconds || 0);

   
    const cutoff = new Date(medTime.getTime() + 60 * 60 * 1000);

    console.log(
      `Medicine Time: ${medTime} | Cutoff (1 hr later): ${cutoff} | Now: ${now}`
    );

    if (now > cutoff) {
      console.log(`Auto-skip triggered for "${med.medication}" (missed time)`);

      this.medicationService.markMedication(
        med.prescriptionId,
        med.prescriptionConditionId,
        med.statementId,
        false
      ).subscribe({
        next: () => {
          console.log(`✔️ Auto-skip logged for "${med.medication}"`);
          med.status = 'SKIPPED';
          med.taken = false; // optional, for backwards compatibility
        },
        error: err => console.error(`❌ Error auto-marking skipped: "${med.medication}"`, err)
      });
    } else {
      console.log(`Not yet skipping "${med.medication}", cutoff not reached`);
    }
  });
}

}
