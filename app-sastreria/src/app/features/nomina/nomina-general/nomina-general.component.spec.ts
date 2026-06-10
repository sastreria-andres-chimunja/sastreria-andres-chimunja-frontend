import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominaGeneralComponent } from './nomina-general.component';

describe('NominaGeneralComponent', () => {
  let component: NominaGeneralComponent;
  let fixture: ComponentFixture<NominaGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominaGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominaGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
