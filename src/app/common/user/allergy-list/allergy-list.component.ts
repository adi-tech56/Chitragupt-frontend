import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientAllergyService } from 'src/app/core/Services/PatientServices/patient-allergy.service';
import { ToastService } from 'src/app/core/Services/toast.service';

import { Location } from '@angular/common';

@Component({
  selector: 'app-allergy-list',
  templateUrl: './allergy-list.component.html',
  styleUrls: ['./allergy-list.component.css'],
})
export class AllergyListComponent implements OnInit {
  allergies: any[] = [];

  constructor(
    private allergyService: PatientAllergyService,
    private router: Router,
    private toaster: ToastService,
    private location: Location
  ) {}

  ngOnInit() {
    this.loadAllergies();
  }

  loadAllergies() {
    this.allergyService.getAllergy().subscribe((res) => {
      this.allergies = res;
    });
  }

  addAllergy() {
    this.router.navigate(['/user/allergyForm']);
  }

  updateAllergy(allergy: any) {
    this.router.navigate(['/user/allergyForm', allergy.slug]);
  }

  deleteAllergy(slug: string) {
    this.allergyService.deleteAllergy(slug).subscribe(() => {
      this.toaster.show('Allergy deleted', 'success');
      this.loadAllergies();
    });
  }
  goBack() {
    this.location.back();
  }
}
