import { Component, OnInit } from '@angular/core';
import { PatientProfileService } from 'src/app/core/Services/PatientServices/patient-profile.service';
import { PatientContactService } from 'src/app/core/Services/PatientServices/patient-contact.service';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { AuthService } from 'src/app/core/Services/auth-service.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ExportPrescriptionService } from 'src/app/core/Services/PrescriptionServices/export-prescription.service';
import { debounceTime } from 'rxjs/operators';
import { ToastService } from 'src/app/core/Services/toast.service';

declare var bootstrap: any;

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

  // location/autocomplete datasets (same as emergency contact)
  cityData: Array<{
    city: string;
    state: string;
    country: string;
    postalCode: string;
  }> = [];
  countries: string[] = [];
  statesList: string[] = [];
  citiesList: string[] = [];

  filteredCountries: string[] = [];
  filteredStates: string[] = [];
  filteredCities: string[] = [];
  maritalTypes: string[] = [];

  showCountry = false;
  showState = false;
  showCity = false;

  telecomErrors: { system?: string | null; value?: string | null } = {};

  private phoneRegex = /^(?!.*^(\d)\1{9}$)\d{10}$/;

  private profileBase = 'patient/profile';

  constructor(
    private profileService: PatientProfileService,
    private contactService: PatientContactService,
    private allergyService: PatientAllergyService,
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private fhirService: ExportPrescriptionService,
    private toaster: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    // Load marital status list
    this.http.get<any[]>('assets/data/relations-type.json').subscribe({
      next: (list) => {
        this.maritalTypes = (list || []).map((x) => x.display || x.code || x);
      },
      error: () => console.warn('Failed to load relations-type.json'),
    });

    this.http.get<any[]>('assets/data/india-locations.json').subscribe({
      next: (list) => {
        this.cityData = list || [];
        this.citiesList = Array.from(
          new Set(this.cityData.map((x) => x.city))
        ).sort();
        this.statesList = Array.from(
          new Set(this.cityData.map((x) => x.state))
        ).sort();
        this.countries = Array.from(
          new Set(this.cityData.map((x) => x.country))
        ).sort();

        // init filtered lists
        this.filteredCities = this.citiesList.slice(0, 200);
        this.filteredStates = this.statesList.slice(0, 200);
        this.filteredCountries = this.countries.slice(0, 200);
      },
      error: (err) => console.warn('Failed to load india-locations.json', err),
    });
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
  validateBasicField(field: string, value: any): string | null {
    if (field === 'firstName') {
      if (!value || value.trim().length === 0) return 'First Name is required.';
      if (!/^[A-Za-z ]+$/.test(value)) return 'Only letters allowed.';
    }

    if (field === 'birthDate') {
      if (!value) return 'Birth Date is required.';
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid date.';
      const today = new Date();
      if (date > today) return 'Birth date cannot be in the future.';
    }

    if (field === 'maritalStatus') {
      if (!value || value.trim().length === 0)
        return 'Marital Status is required.';
    }

    return null;
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

  downloadSelected(): void {
    this.fhirService.downloadPatientBundle().subscribe(
      (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patient_bundle.json';
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

  openEditBasicModal(field: string) {
    this.editingField = field;
    this.editingFieldLabel = this.prettyLabel(field);

    // Pre-fill value
    this.editingValue = this.basicInfo[field] ?? '';

    // Special handling for marital status (dropdown)
    if (field === 'maritalStatus') {
      // ensure maritalType list is already loaded
      if (!this.maritalTypes || this.maritalTypes.length === 0) {
        console.warn('Marital status list is empty or not loaded.');
      }
    }

    // Open bootstrap modal
    const modalEl = document.getElementById('editBasicModal') as any;
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
    const error = this.validateBasicField(this.editingField, this.editingValue);
    if (error) {
      this.toaster.show('Error!', 'error');
      return;
    }

    const patientId = this.auth.getUserId();
    if (!patientId) {
      this.toaster.show('User not identified', 'error');
      return;
    }

    const payload: any = {};
    payload[this.editingField] = this.editingValue;

    this.profileService.saveProfile(patientId, payload).subscribe({
      next: () => {
        this.basicInfo[this.editingField] = this.editingValue;

        // close modal
        (
          document.querySelector('#editBasicModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save basic field', err);
        this.toaster.show('Failed to save field', 'error');
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

    // init filtered lists and hide dropdowns
    this.filteredCities = this.citiesList.slice(0, 200);
    this.filteredStates = this.statesList.slice(0, 200);
    this.filteredCountries = this.countries.slice(0, 200);
    this.showCity = false;
    this.showState = false;
    this.showCountry = false;

    const modalEl = document.getElementById('editAddressModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  onAddressInput(type: 'city' | 'state' | 'country') {
    const v = (this.addressForm as any)[type] || '';
    const q = v.toString().toLowerCase().trim();
    if (type === 'city') {
      this.filteredCities = !q
        ? this.citiesList.slice(0, 200)
        : this.citiesList
            .filter((x) => x.toLowerCase().includes(q))
            .slice(0, 200);
    } else if (type === 'state') {
      this.filteredStates = !q
        ? this.statesList.slice(0, 200)
        : this.statesList
            .filter((x) => x.toLowerCase().includes(q))
            .slice(0, 200);
    } else {
      this.filteredCountries = !q
        ? this.countries.slice(0, 200)
        : this.countries
            .filter((x) => x.toLowerCase().includes(q))
            .slice(0, 200);
    }
  }

  selectAddressCity(city: string) {
    this.addressForm.city = city;
    const found = this.cityData.find(
      (c) => c.city.toLowerCase() === city.toLowerCase()
    );
    if (found) {
      this.addressForm.state = found.state;
      this.addressForm.country = found.country;
      this.addressForm.postalCode = found.postalCode;
    }
    this.showCity = false;
  }

  selectAddressState(state: string) {
    this.addressForm.state = state;
    this.showState = false;
  }

  selectAddressCountry(country: string) {
    this.addressForm.country = country;
    this.showCountry = false;
  }

  hideAddressDropdownLater(type: 'city' | 'state' | 'country') {
    setTimeout(() => {
      if (type === 'city') this.showCity = false;
      if (type === 'state') this.showState = false;
      if (type === 'country') this.showCountry = false;
    }, 180);
  }

  isAddressInvalid(field: string) {
    // simple required checks used in template
    if (!this.addressForm) return false;
    if (field === 'text') return !this.addressForm.text?.trim();
    if (field === 'city') return !this.addressForm.city?.trim();
    if (field === 'state') return !this.addressForm.state?.trim();
    if (field === 'postalCode') return !this.addressForm.postalCode?.trim();
    if (field === 'country') return !this.addressForm.country?.trim();
    return false;
  }

  saveAddress() {
    const patientId = this.auth.getUserId();
    if (!patientId) {
      this.toaster.show('User not identified', 'error');
      return;
    }

    // validate
    if (
      this.isAddressInvalid('text') ||
      this.isAddressInvalid('city') ||
      this.isAddressInvalid('state') ||
      this.isAddressInvalid('postalCode') ||
      this.isAddressInvalid('country')
    ) {
      this.toaster.show('Please fill required address fields.', 'error');
      return;
    }

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
        if (idx >= 0)
          this.addresses[idx] = { ...this.addresses[idx], ...updated };
        else this.addresses.push(updated);
        (
          document.querySelector('#editAddressModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save address', err);
        this.toaster.show('Failed to save address', 'error');
      },
    });
  }

  deleteAddress(index: number, address: any) {
    if (!address?.id) {
      this.toaster.show('Address id missing!', 'error');
      return;
    }
    if (!confirm('Delete this address?')) return;

    this.http.delete(`${this.profileBase}/address/${address.id}`).subscribe({
      next: () => this.addresses.splice(index, 1),
      error: (err) => {
        console.error('Delete address failed', err);
        this.toaster.show('Delete address failed', 'error');
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
    this.telecomErrors = {};
    const modalEl = document.getElementById('editTelecomModal')!;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  validateTelecom() {
    this.telecomErrors = {};
    if (!this.telecomForm.system) {
      this.telecomErrors.system = 'System is required.';
    }
    if (!this.telecomForm.value || !this.telecomForm.value.toString().trim()) {
      this.telecomErrors.value = 'Value is required.';
      return;
    }
    // validate based on system
    if (this.telecomForm.system === 'email') {
      // basic email regex (sufficient for client-side)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.telecomForm.value)) {
        this.telecomErrors.value = 'Enter a valid email address.';
      }
    } else if (this.telecomForm.system === 'phone') {
      if (!this.phoneRegex.test(this.telecomForm.value)) {
        this.telecomErrors.value =
          'Enter a valid 10-digit phone number (not all digits same).';
      }
    }
  }

  saveTelecom() {
    const patientId = this.auth.getUserId();
    if (!patientId) {
      this.toaster.show('User not identified', 'error');
      return;
    }

    this.validateTelecom();
    if (this.telecomErrors.system || this.telecomErrors.value) {
      this.toaster.show('Please fix telecom errors.', 'error');
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
        if (idx >= 0)
          this.telecoms[idx] = { ...this.telecoms[idx], ...updated };
        else this.telecoms.push(updated);
        (
          document.querySelector('#editTelecomModal .btn-close') as HTMLElement
        )?.click();
      },
      error: (err) => {
        console.error('Failed to save telecom', err);
        this.toaster.show('Failed to save telecom', 'error');
      },
    });
  }

  deleteTelecom(index: number, telecom: any) {
    if (!telecom?.id) {
      this.toaster.show('Telecom id missing', 'error');
      return;
    }
    if (!confirm('Delete this telecom?')) return;

    this.http.delete(`${this.profileBase}/telecoms/${telecom.id}`).subscribe({
      next: () => this.telecoms.splice(index, 1),
      error: (err) => {
        console.error('Delete telecom failed', err);
        this.toaster.show('Could not delete telecom.', 'error');
      },
    });
  }

  deleteAllergy(index: number, allergy: any) {
    if (!allergy?.id) {
      this.toaster.show('Allergy id missing!', 'error');
      return;
    }
    if (!confirm('Delete this allergy?')) return;

    this.allergyService.deleteAllergy(allergy.id).subscribe({
      next: () => this.allergies.splice(index, 1),
      error: (err) => {
        console.error('Failed to delete allergy', err);
        this.toaster.show('Could not delete allergy!', 'error');
      },
    });
  }

  addEmergencyContact() {
    this.router.navigate(['/user/emergencyContact']);
  }
  addAllergy() {
    this.router.navigate(['/user/allergyList']);
  }
}
