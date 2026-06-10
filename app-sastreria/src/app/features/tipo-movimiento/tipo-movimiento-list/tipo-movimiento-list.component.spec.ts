import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoMovimientoListComponent } from './tipo-movimiento-list.component';

describe('TipoMovimientoListComponent', () => {
  let component: TipoMovimientoListComponent;
  let fixture: ComponentFixture<TipoMovimientoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoMovimientoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoMovimientoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
