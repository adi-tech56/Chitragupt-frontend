import { Component, OnInit } from '@angular/core';
import { MedicationNormalized, MedicationWithStatus, PrescriptionResponse } from 'src/app/core/Models/Medication';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-view-prescription',
  templateUrl: './view-prescription.component.html',
  styleUrls: ['./view-prescription.component.css']
})
export class ViewPrescriptionComponent implements OnInit {
  allMeds:PrescriptionResponse[] = [];
  constructor(private medicationService: MedicationService,private location:Location) { }
  goBack() {
  this.location.back();
}

  ngOnInit() {
    this.medicationService.getPrescriptions().subscribe(meds => {
      this.allMeds = meds;
    });
  }

}
