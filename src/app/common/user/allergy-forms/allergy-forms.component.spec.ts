import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllergyFormsComponent } from './allergy-forms.component';

describe('AllergyFormsComponent', () => {
  let component: AllergyFormsComponent;
  let fixture: ComponentFixture<AllergyFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllergyFormsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllergyFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
