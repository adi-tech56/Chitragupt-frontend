import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePrescriptionComponent } from './update-prescription.component';

describe('UpdatePrescriptionComponent', () => {
  let component: UpdatePrescriptionComponent;
  let fixture: ComponentFixture<UpdatePrescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdatePrescriptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePrescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
