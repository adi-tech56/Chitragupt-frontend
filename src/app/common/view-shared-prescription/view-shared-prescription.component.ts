import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionResponse } from 'src/app/core/Models/Medication';
import { DownloadPrescriptionService } from 'src/app/core/Services/PrescriptionServices/download-prescription.service';
import { ExportPrescriptionService } from 'src/app/core/Services/PrescriptionServices/export-prescription.service';
import { SharePrescriptionService } from 'src/app/core/Services/PrescriptionServices/share-presecription.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-shared-prescription',
  templateUrl: './view-shared-prescription.component.html',
  styleUrls: ['./view-shared-prescription.component.css'],
})
export class ViewSharedPrescriptionComponent {
  allMeds: PrescriptionResponse[] = [];
  isForbidden = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private sharePrescriptionService: SharePrescriptionService,
    private exportPrescripiton: ExportPrescriptionService,
    private router: Router,
    private location: Location,
    private download: DownloadPrescriptionService
  ) { }
  goBack() {
    this.location.back();
  }
  goToUpdatePage(med: any) {
    // Store medication in sessionStorage
    sessionStorage.setItem('medication', JSON.stringify(med));

    this.router.navigate(['/user/update-medication']);
  }

  openIndex: number | null = null;
  patientId!: number;
  toggleAccordion(index: number) {
    if (this.openIndex === index) {
      this.openIndex = null;
    } else {
      this.openIndex = index;
    }
  }

 ngOnInit() {
  this.patientId = Number(this.route.snapshot.paramMap.get('id'));

  this.sharePrescriptionService
    .getPrescriptionsByPatient(this.patientId)
    .subscribe({
      next: (meds) => {
        this.allMeds = meds;
        this.isForbidden = false;
      },
      error: (err) => {
        console.error(err);

        if (err.status === 403) {
          this.isForbidden = true;
          this.errorMessage =
            'You are not authorized to access this patient’s prescriptions.';
        } else {
          this.errorMessage = 'Something went wrong. Please try again later.';
        }
      },
    });
}

  downloadPdf(superPrescriptionId: number) {
    this.download
      .downloadSuperPrescriptionPdf(superPrescriptionId)
      .subscribe((response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `super_prescription_${superPrescriptionId}.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
      });
  }

  downloadBundle(superPrescriptionId: number) {
    this.exportPrescripiton
      .downloadMedicationBundle(superPrescriptionId)
      .subscribe(
        (blob) => {
          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'medications_bundle.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Download failed', error);
        }
      );
  }
}
