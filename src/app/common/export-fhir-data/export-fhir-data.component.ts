import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { PrescriptionResponse } from 'src/app/core/Models/Medication';
import { PaginationState } from 'src/app/core/Models/Pagination';
import { ExportPrescriptionService } from 'src/app/core/Services/PrescriptionServices/export-prescription.service';
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { getTotalPages, paginate } from 'src/app/shared/pagination.helper';
import { Location } from '@angular/common';
@Component({
  selector: 'app-export-fhir-data',
  templateUrl: './export-fhir-data.component.html',
  styleUrls: ['./export-fhir-data.component.css']
})
export class ExportFhirDataComponent {
  prescriptions: PrescriptionResponse[] = [];
  selectedIds: number[] = [];
  pagination: PaginationState = { page: 1, pageSize: 4 };
  constructor(private prescriptionService: ExportPrescriptionService,
    private medicationService: MedicationService, private http: HttpClient, private location: Location) { }

  goBack() {
    this.location.back();
  }
  openIndex: number | null = null;

  toggleAccordion(index: number) {
    if (this.openIndex === index) {
      this.openIndex = null;
    } else {
      this.openIndex = index;
    }
  }
  ngOnInit(): void {
    this.loadPrescriptions();
  }

  loadPrescriptions(): void {
    this.medicationService.getPrescriptions().subscribe(
      (res) => this.prescriptions = res,
      (err) => console.error(err)
    );
  }
  get paginatedMeds() {
    return paginate(this.prescriptions, this.pagination);
  }

  get totalPages() {
    return getTotalPages(this.prescriptions.length, this.pagination.pageSize);
  }
  setPage(page: number) {
    this.pagination.page = page;
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
