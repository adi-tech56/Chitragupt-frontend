import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationPageComponent } from './medication-page.component';

describe('MedicationPageComponent', () => {
  let component: MedicationPageComponent;
  let fixture: ComponentFixture<MedicationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedicationPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
