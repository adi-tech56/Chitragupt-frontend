import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationLayoutComponent } from './medication-layout.component';

describe('MedicationLayoutComponent', () => {
  let component: MedicationLayoutComponent;
  let fixture: ComponentFixture<MedicationLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicationLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicationLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
