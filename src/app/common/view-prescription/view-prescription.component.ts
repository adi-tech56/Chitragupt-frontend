import { Component, OnInit } from '@angular/core';
import { MedicationNormalized, MedicationWithStatus, PrescriptionResponse } from 'src/app/core/Models/Medication';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { Location } from '@angular/common';
import { DownloadPrescriptionService } from 'src/app/core/Services/PrescriptionServices/download-prescription.service';
@Component({
  selector: 'app-view-prescription',
  templateUrl: './view-prescription.component.html',
  styleUrls: ['./view-prescription.component.css']
})
export class ViewPrescriptionComponent implements OnInit {

  allMeds:PrescriptionResponse[] = [];
  constructor(private medicationService: MedicationService,private location:Location,private download:DownloadPrescriptionService) { }
  goBack() {
  this.location.back();
}

  ngOnInit() {
    this.medicationService.getPrescriptions().subscribe(meds => {
      this.allMeds = meds;
    });
  }
downloadPdf(superPrescriptionId:number) {

    this.download.downloadSuperPrescriptionPdf(superPrescriptionId)
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
}
