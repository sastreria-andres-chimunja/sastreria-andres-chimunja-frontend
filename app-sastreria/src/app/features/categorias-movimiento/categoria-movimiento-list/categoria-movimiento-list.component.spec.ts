import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaMovimientoListComponent } from './categoria-movimiento-list.component';

describe('CategoriaMovimientoListComponent', () => {
  let component: CategoriaMovimientoListComponent;
  let fixture: ComponentFixture<CategoriaMovimientoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaMovimientoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaMovimientoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
