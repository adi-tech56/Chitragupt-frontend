import { Component, OnInit } from '@angular/core';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserLayoutComponent } from 'src/app/layout/user-layout/user-layout.component';

declare var bootstrap: any; // bootstrap modal

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent implements OnInit {
  loading = false;
  firstLetter = '';
  basicInfo: any = {};
  addresses: any[] = [];
  telecoms: any[] = [];
  allergies: any[] = [];

  // For editing modals
  editingField: string = '';
  editingFieldLabel: string = '';
  editingValue: any = '';

  addressForm: any = {
    id: null,
    text: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };
  telecomForm: any = { id: null, system: '', value: '' };

  private profileBase = 'http://localhost:8089/patient/profile';

  constructor(
    private profileService: PatientProfileService,
    private contactService: PatientContactService,
    private allergyService: PatientAllergyService,
    private auth: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (res: any) => {
        if (res && res.hasProfile && res.profile) {
          this.setProfileData(res.profile);
        } else {
          this.loadContacts();
        }
      },
      error: (err) => {
        console.error('Profile load failed', err);
        this.loadContacts();
      },
      complete: () => {
        this.loadAllergies();
        this.loading = false;
      },
    });
  }

  setProfileData(profile: any) {
    this.basicInfo = {
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      birthDate: profile.birthDate || '',
      gender: profile.gender || '',
      maritalStatus: profile.maritalStatus || '',
    };

    this.firstLetter = this.basicInfo.firstName
      ? this.basicInfo.firstName[0].toUpperCase()
      : '';

    this.addresses = profile.addresses ?? [];
    this.telecoms = profile.telecoms ?? [];

    if (
      !this.addresses ||
      this.addresses.length === 0 ||
      !this.telecoms ||
      this.telecoms.length === 0
    ) {
      this.loadContacts();
    }
  }

  loadContacts() {
    this.contactService.getContact().subscribe({
      next: (res: any) => {
        if (!res) return;
        this.addresses = res.addresses ?? res.patientAddresses ?? [];
        this.telecoms = res.telecoms ?? res.patientTelecoms ?? [];
      },
      error: (err) => console.error('Contacts load failed', err),
    });
  }

  loadAllergies() {
    this.allergyService.getAllergy().subscribe({
      next: (res: any) => (this.allergies = res ?? []),
      error: (err) => console.error('Allergy load failed', err),
    });
  }

  combinedAddress(ad: any): string {
    if (ad?.text) return ad.text;
    const parts = [
      ad?.line1,
      ad?.line2,
      ad?.city,
      ad?.state,
      ad?.postalCode,
      ad?.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  // ============ BASIC INFO EDIT ============

  openEditBasicModal(field: string) {
    this.editingField = field;
    this.editingFieldLabel = this.prettyLabel(field);
    this.editingValue = this.basicInfo[field] ?? '';
    const modalEl = document.getElementById('editBasicModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  prettyLabel(f: string) {
    const map: any = {
      firstName: 'First Name',
      middleName: 'Middle Name',
      lastName: 'Last Name',
      birthDate: 'Birth Date',
      gender: 'Gender',
      maritalStatus: 'Marital Status',
    };
    return map[f] ?? f;
  }

  saveBasicField() {
    const patientId = this.auth.getUserId();
    if (!patientId) {
      alert('User not identified');
      return;
    }

    const payload: any = {};
    payload[this.editingField] = this.editingValue;

    // call profile save endpoint
    this.profileService.saveProfile(patientId, payload).subscribe({
      next: (res: any) => {
        // update local UI
        this.basicInfo[this.editingField] = this.editingValue;
        // hide modal
        (
          document.querySelector('#editBasicModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save basic field', err);
        alert('Could not save. See console.');
      },
    });
  }

  // ============ ADDRESS EDIT ============

  openEditAddressModal(address: any) {
    this.addressForm = {
      id: address.id ?? null,
      text: address.text ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      postalCode: address.postalCode ?? '',
      country: address.country ?? '',
    };
    const modalEl = document.getElementById('editAddressModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  saveAddress() {
    const patientId = this.auth.getUserId();
    if (!patientId) {
      alert('User not identified');
      return;
    }

    // Build address dto as backend expects (PatientAddressDto)
    const dto: any = {
      addresses: [
        {
          id: this.addressForm.id,
          text: this.addressForm.text,
          city: this.addressForm.city,
          state: this.addressForm.state,
          postalCode: this.addressForm.postalCode,
          country: this.addressForm.country,
        },
      ],
    };

    this.profileService.saveProfile(patientId, dto).subscribe({
      next: (res: any) => {
        const idx = this.addresses.findIndex(
          (a) => a.id === this.addressForm.id
        );
        const updated = { ...this.addressForm };
        if (idx >= 0) {
          this.addresses[idx] = { ...this.addresses[idx], ...updated };
        } else {
          this.addresses.push(updated);
        }
        (
          document.querySelector('#editAddressModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save address', err);
        alert('Could not save address. See console.');
      },
    });
  }

  deleteAddress(index: number, address: any) {
    if (!address?.id) {
      alert('Address id missing');
      return;
    }
    if (!confirm('Delete this address?')) return;

    this.http.delete(`${this.profileBase}/address/${address.id}`).subscribe({
      next: () => this.addresses.splice(index, 1),
      error: (err) => {
        console.error('Delete address failed', err);
        alert('Could not delete address.');
      },
    });
  }

  // ============ TELECOM EDIT ============

  openEditTelecomModal(telecom: any) {
    this.telecomForm = {
      id: telecom.id ?? null,
      system: telecom.system ?? '',
      value: telecom.value ?? '',
    };
    const modalEl = document.getElementById('editTelecomModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  saveTelecom() {
    const patientId = this.auth.getUserId();
    if (!patientId) {
      alert('User not identified');
      return;
    }

    const dto: any = {
      telecoms: [
        {
          id: this.telecomForm.id,
          system: this.telecomForm.system,
          value: this.telecomForm.value,
        },
      ],
    };

    this.profileService.saveProfile(patientId, dto).subscribe({
      next: (res: any) => {
        const idx = this.telecoms.findIndex(
          (t) => t.id === this.telecomForm.id
        );
        const updated = { ...this.telecomForm };
        if (idx >= 0) {
          this.telecoms[idx] = { ...this.telecoms[idx], ...updated };
        } else {
          this.telecoms.push(updated);
        }
        (
          document.querySelector('#editTelecomModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save telecom', err);
        alert('Could not save telecom. See console.');
      },
    });
  }

  deleteTelecom(index: number, telecom: any) {
    if (!telecom?.id) {
      alert('Telecom id missing');
      return;
    }
    if (!confirm('Delete this telecom?')) return;

    this.http.delete(`${this.profileBase}/telecoms/${telecom.id}`).subscribe({
      next: () => this.telecoms.splice(index, 1),
      error: (err) => {
        console.error('Delete telecom failed', err);
        alert('Could not delete telecom.');
      },
    });
  }

  // ============ ALLERGY ============
  deleteAllergy(index: number, allergy: any) {
    if (!allergy?.id) {
      alert('Allergy id missing');
      return;
    }
    if (!confirm('Delete this allergy?')) return;

    this.allergyService.deleteAllergy(allergy.id).subscribe({
      next: () => this.allergies.splice(index, 1),
      error: (err) => {
        console.error('Failed to delete allergy', err);
        alert('Could not delete allergy.');
      },
    });
  }
  addEmergencyContact() {
    this.router.navigate(['/user/emergencyContact']);
  }

  addAllergy() {
    this.router.navigate(['/user/allergyForm']);
  }
}
