import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAllergyComponent } from './patient-allergy.component';

describe('PatientAllergyComponent', () => {
  let component: PatientAllergyComponent;
  let fixture: ComponentFixture<PatientAllergyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientAllergyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAllergyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
