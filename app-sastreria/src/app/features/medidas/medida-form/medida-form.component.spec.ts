import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedidaFormComponent } from './medida-form.component';

describe('MedidaFormComponent', () => {
  let component: MedidaFormComponent;
  let fixture: ComponentFixture<MedidaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedidaFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedidaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
