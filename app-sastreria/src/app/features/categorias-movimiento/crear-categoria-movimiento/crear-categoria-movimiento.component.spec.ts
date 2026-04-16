import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearCategoriaMovimientoComponent } from './crear-categoria-movimiento.component';

describe('CrearCategoriaMovimientoComponent', () => {
  let component: CrearCategoriaMovimientoComponent;
  let fixture: ComponentFixture<CrearCategoriaMovimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearCategoriaMovimientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearCategoriaMovimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
