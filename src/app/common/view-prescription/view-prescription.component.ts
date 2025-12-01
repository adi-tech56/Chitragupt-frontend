import { Component, OnInit } from '@angular/core';
import { MedicationNormalized, MedicationWithStatus, PrescriptionResponse } from 'src/app/core/Models/Medication';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { Location } from '@angular/common';
import { DownloadPrescriptionService } from 'src/app/core/Services/PrescriptionServices/download-prescription.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-view-prescription',
  templateUrl: './view-prescription.component.html',
  styleUrls: ['./view-prescription.component.css']
})
export class ViewPrescriptionComponent implements OnInit {

  allMeds:PrescriptionResponse[] = [];
  constructor(private medicationService: MedicationService,private router:Router ,private location:Location,private download:DownloadPrescriptionService) { }
  goBack() {
  this.location.back();
}
goToUpdatePage(med: any) {
  // Store medication in sessionStorage
  sessionStorage.setItem('medication', JSON.stringify(med));


  this.router.navigate(['/user/update-medication']);
}

openIndex: number | null = null;

toggleAccordion(index: number) {
  if (this.openIndex === index) {
    this.openIndex = null;
  } else {
    this.openIndex = index;
  }
}

  ngOnInit() {
    this.medicationService.getPrescriptions().subscribe(meds => {
      this.allMeds = meds;
      console.log(meds)
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
