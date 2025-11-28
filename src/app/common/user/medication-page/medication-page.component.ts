
import { MedicationService } from 'src/app/core/Services/PrescriptionServices/medication-service';
import { MedicationWithStatus, PatientMedicationLogs } from 'src/app/core/Models/Medication';
import { Component, OnInit } from '@angular/core';
import { PaginationState } from 'src/app/core/Models/Pagination';
import { getTotalPages, paginate } from 'src/app/shared/pagination.helper';

@Component({
  selector: 'app-medication-page',
  templateUrl: './medication-page.component.html',
  styleUrls: ['./medication-page.component.css']
})
export class MedicationPageComponent  {


}
