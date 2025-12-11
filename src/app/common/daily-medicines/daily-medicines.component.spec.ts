import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyMedicinesComponent } from './daily-medicines.component';

describe('DailyMedicinesComponent', () => {
  let component: DailyMedicinesComponent;
  let fixture: ComponentFixture<DailyMedicinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyMedicinesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyMedicinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
