import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedidasListComponent } from './medidas-list.component';

describe('MedidasListComponent', () => {
  let component: MedidasListComponent;
  let fixture: ComponentFixture<MedidasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedidasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedidasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
