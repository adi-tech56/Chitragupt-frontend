import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSharedPrescriptionComponent } from './view-shared-prescription.component';

describe('ViewSharedPrescriptionComponent', () => {
  let component: ViewSharedPrescriptionComponent;
  let fixture: ComponentFixture<ViewSharedPrescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewSharedPrescriptionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSharedPrescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
