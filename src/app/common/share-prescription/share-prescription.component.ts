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
    this.error = null;
    this.service.getSharedPatients().subscribe({
      next: (list) => {
        const seen = new Set<string>();

        this.sharedPatients = list.filter((p) => {
          if (!p.shareToken) return false;
          if (seen.has(p.shareToken)) return false;
          seen.add(p.shareToken);
          return true;
        });

        console.log('Shared patients:', this.sharedPatients);
      },
      error: (err) => {
        console.error('Failed to load shared patients', err);
        this.error = 'Failed to load patients. Please try again later.';
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
