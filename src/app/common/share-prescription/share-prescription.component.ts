import { SharePrescriptionService } from './../../core/Services/PrescriptionServices/share-presecription.service';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import {
  EmergencyContactPatientDto,
  SuperPrescriptionData,
} from 'src/app/core/Models/Medication';

@Component({
  selector: 'app-share-prescription',
  templateUrl: './share-prescription.component.html',
  styleUrls: ['./share-prescription.component.css'],
})
export class SharePrescriptionComponent implements OnInit {
  sharedPatients: EmergencyContactPatientDto[] = [];
  loading = false;
  error: string | null = null;

  // modal state
  activePatientName = '';
  activePatientPrescriptions: SuperPrescriptionData[] = [];
  isModalOpen = false;

  constructor(
    private service: SharePrescriptionService,
    private location: Location
  ) {}
  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadSharedPatients();
  }

  loadSharedPatients() {
    this.loading = true;
    this.error = null;
    this.service.getSharedPatients().subscribe({
      next: (list) => {
        // ensure distinct patients (if backend returns duplicates)
        const seen = new Set<number>();
        this.sharedPatients = list.filter((p) => {
          if (!p.patientId) return false;
          if (seen.has(p.patientId)) return false;
          seen.add(p.patientId);
          return true;
        });
        console.log(this.sharedPatients);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load shared patients', err);
        this.error = 'Failed to load patients. Please try again later.';
        this.loading = false;
      },
    });
  }

  fullName(p: EmergencyContactPatientDto) {
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  }

  openPrescriptionsModal(patient: EmergencyContactPatientDto) {
    this.activePatientName = this.fullName(patient) || 'Patient';
    this.activePatientPrescriptions = patient.prescriptions || [];
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.activePatientPrescriptions = [];
  }
}
