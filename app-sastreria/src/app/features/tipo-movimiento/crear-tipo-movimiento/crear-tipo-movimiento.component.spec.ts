import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearTipoMovimientoComponent } from './crear-tipo-movimiento.component';

describe('CrearTipoMovimientoComponent', () => {
  let component: CrearTipoMovimientoComponent;
  let fixture: ComponentFixture<CrearTipoMovimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearTipoMovimientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearTipoMovimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
