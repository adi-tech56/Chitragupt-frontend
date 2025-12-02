import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportFhirDataComponent } from './export-fhir-data.component';

describe('ExportFhirDataComponent', () => {
  let component: ExportFhirDataComponent;
  let fixture: ComponentFixture<ExportFhirDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExportFhirDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportFhirDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
