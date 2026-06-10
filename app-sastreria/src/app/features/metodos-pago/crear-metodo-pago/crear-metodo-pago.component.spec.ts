import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearMetodoPagoComponent } from './crear-metodo-pago.component';

describe('CrearMetodoPagoComponent', () => {
  let component: CrearMetodoPagoComponent;
  let fixture: ComponentFixture<CrearMetodoPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearMetodoPagoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearMetodoPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
