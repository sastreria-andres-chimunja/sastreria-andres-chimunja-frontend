import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-medida-form',
  templateUrl: './medida-form.component.html',
})
export class MedidaFormComponent {
  form: FormGroup;

  tipoPrenda = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      tipoPrenda: [''],
    });
  }

  seleccionarTipo(tipo: string) {
    this.tipoPrenda = tipo;
  }
}
