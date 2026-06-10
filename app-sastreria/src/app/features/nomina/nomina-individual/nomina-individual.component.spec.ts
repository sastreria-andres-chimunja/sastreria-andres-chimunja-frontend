import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominaIndividualComponent } from './nomina-individual.component';

describe('NominaIndividualComponent', () => {
  let component: NominaIndividualComponent;
  let fixture: ComponentFixture<NominaIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominaIndividualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominaIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
