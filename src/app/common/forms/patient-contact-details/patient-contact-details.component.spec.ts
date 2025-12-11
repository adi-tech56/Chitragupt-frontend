import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientContactDetailsComponent } from './patient-contact-details.component';

describe('PatientContactDetailsComponent', () => {
  let component: PatientContactDetailsComponent;
  let fixture: ComponentFixture<PatientContactDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PatientContactDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientContactDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
