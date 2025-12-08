import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdatePrescriptionComponent } from './add-update-prescription.component';

describe('AddUpdatePrescriptionComponent', () => {
  let component: AddUpdatePrescriptionComponent;
  let fixture: ComponentFixture<AddUpdatePrescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdatePrescriptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdatePrescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
