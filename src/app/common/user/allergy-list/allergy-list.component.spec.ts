import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllergyListComponent } from './allergy-list.component';

describe('AllergyListComponent', () => {
  let component: AllergyListComponent;
  let fixture: ComponentFixture<AllergyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllergyListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllergyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
