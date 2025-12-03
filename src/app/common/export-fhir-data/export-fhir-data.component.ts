import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { PrescriptionResponse } from 'src/app/core/Models/Medication';
import { ExportPrescriptionService } from 'src/app/core/Services/PrescriptionServices/export-prescription.service';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';

@Component({
  selector: 'app-export-fhir-data',
  templateUrl: './export-fhir-data.component.html',
  styleUrls: ['./export-fhir-data.component.css']
})
export class ExportFhirDataComponent {
 prescriptions: PrescriptionResponse[] = [];
  selectedIds: number[] = [];

  constructor(private prescriptionService: ExportPrescriptionService,
   private medicationService:MedicationService , private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  loadPrescriptions(): void {
    this.medicationService.getPrescriptions().subscribe(
      (res) => this.prescriptions = res,
      (err) => console.error(err)
    );
  }

  toggleSelection(prescriptionId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.push(prescriptionId);
    } else {
      this.selectedIds = this.selectedIds.filter(id => id !== prescriptionId);
    }
  }

  downloadSelected(): void {
    if (this.selectedIds.length === 0) {
      alert('Please select at least one prescription.');
      return;
    }
  // this.prescriptionService.downloadMedicationBundle(this.selectedIds).subscribe(
  // (response: any) => {
  //   const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'medication-bundle.json';
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // },
  // (error: any) => {
  //   console.error('Download failed', error);
  // }
    this.prescriptionService.downloadMedicationBundle(this.selectedIds)
      .subscribe(blob => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medications_bundle.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, error => {
        console.error('Download failed', error);
      });
  }


  }
