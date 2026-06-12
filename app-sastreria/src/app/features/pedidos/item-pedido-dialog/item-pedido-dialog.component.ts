import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { Empleado } from '../../../shared/models/Empleado';
import { Estado } from '../../../shared/models/Estado';
import { Medida } from '../../../shared/models/Medida';
import { stringToDate } from '../../../utils/date.utils';

export interface ItemDialogData {
  item?: any;          // item existente (edit) o null (create)
  idPedido: number;
  idCliente: number;
  empleados: Empleado[];
  estados: Estado[];
  medidas: Medida[];   // medidas del cliente
  imagenes?: any[];    // fotos existentes (edit mode)
}

export interface ItemDialogResult {
  item: any;
  nuevaMedida: any | null;
  fotosNuevas: File[];
  fotosEliminar: number[];
}

@Component({
  selector: 'app-item-pedido-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTabsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  templateUrl: './item-pedido-dialog.component.html',
  styleUrl: './item-pedido-dialog.component.css',
})
export class ItemPedidoDialogComponent implements OnInit {
  form!: FormGroup;
  medidaForm!: FormGroup;

  modoMedida: 'ninguna' | 'guardada' | 'nueva' = 'ninguna';
  isEdit = false;

  // fotos
  fotosNuevas: File[] = [];
  fotosPreview: string[] = [];
  fotosEliminar: number[] = [];
  fotosExistentes: any[] = [];

  readonly camposMedida = [
    { grupo: 'Tronco', campos: [
      { key: 'espalda', label: 'Espalda' },
      { key: 'hombro', label: 'Hombro' },
      { key: 'talleDelantero', label: 'Talle delantero' },
      { key: 'talleTrasero', label: 'Talle trasero' },
      { key: 'pecho', label: 'Pecho' },
      { key: 'cintura', label: 'Cintura' },
      { key: 'base', label: 'Base' },
    ]},
    { grupo: 'Mangas / Escote', campos: [
      { key: 'largoManga', label: 'Largo manga' },
      { key: 'anchoManga', label: 'Ancho manga' },
      { key: 'escote', label: 'Escote' },
      { key: 'distancia', label: 'Distancia' },
      { key: 'separacion', label: 'Separación' },
    ]},
    { grupo: 'Parte inferior', campos: [
      { key: 'largo', label: 'Largo' },
      { key: 'tiro', label: 'Tiro' },
      { key: 'pierna', label: 'Pierna' },
      { key: 'rodilla', label: 'Rodilla' },
      { key: 'bota', label: 'Bota' },
    ]},
  ];

  constructor(
    public dialogRef: MatDialogRef<ItemPedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemDialogData,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data.item?.idItemPedido;
    this.fotosExistentes = this.data.imagenes ?? [];

    if (this.data.item?.idMedida) {
      this.modoMedida = 'guardada';
    }

    this.buildForms();
  }

  private buildForms(): void {
    const item = this.data.item ?? {};
    const estadoPorDefecto = item.idEstado
      ?? this.data.estados.find((e) => e.nombre === 'Pendiente')?.idEstado
      ?? null;
    this.form = this.fb.group({
      descripcion: [item.descripcion ?? '', Validators.required],
      valor: [item.valor ?? '', [Validators.required, Validators.min(0)]],
      comisionEmpleado: [item.comisionEmpleado ?? 0],
      fechaEntrega: [item.fechaEntrega ? stringToDate(item.fechaEntrega) : null, Validators.required],
      observacion: [item.observacion ?? ''],
      idEstado: [estadoPorDefecto, Validators.required],
      idEmpleado: [item.idEmpleado ?? null],
      idMedidaGuardada: [item.idMedida ?? null],
    });

    // Formulario de nueva medida
    const medidaFields: Record<string, any> = {
      tipoPrenda: ['', Validators.required],
      otros: [''],
      observaciones: [''],
    };
    this.camposMedida.forEach((g) =>
      g.campos.forEach((c) => { medidaFields[c.key] = [0]; })
    );
    this.medidaForm = this.fb.group(medidaFields);
  }

  onModoChange(): void {
    // reset selección cuando cambia modo
    this.form.patchValue({ idMedidaGuardada: null });
    this.medidaForm.reset({ tipoPrenda: '' });
  }

  onFileChange(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    files.forEach((f) => {
      this.fotosNuevas.push(f);
      const reader = new FileReader();
      reader.onload = (e) => this.fotosPreview.push(e.target!.result as string);
      reader.readAsDataURL(f);
    });
  }

  eliminarFotoNueva(i: number): void {
    this.fotosNuevas.splice(i, 1);
    this.fotosPreview.splice(i, 1);
  }

  marcarFotoParaEliminar(idImagen: number): void {
    this.fotosEliminar.push(idImagen);
    this.fotosExistentes = this.fotosExistentes.filter((f) => f.idImagen !== idImagen);
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.modoMedida === 'nueva' && this.medidaForm.invalid) {
      this.medidaForm.markAllAsTouched();
      return;
    }

    const formVal = this.form.value;
    const item: any = {
      ...this.data.item,
      idPedido: this.data.idPedido,
      descripcion: formVal.descripcion,
      valor: formVal.valor,
      comisionEmpleado: formVal.comisionEmpleado ?? 0,
      observacion: formVal.observacion,
      idEstado: formVal.idEstado,
      idEmpleado: formVal.idEmpleado || null,
      fechaEntrega: formVal.fechaEntrega,
      idMedida: this.modoMedida === 'guardada' ? formVal.idMedidaGuardada : null,
    };

    const result: ItemDialogResult = {
      item,
      nuevaMedida: this.modoMedida === 'nueva'
        ? { ...this.medidaForm.value, idCliente: this.data.idCliente }
        : null,
      fotosNuevas: this.fotosNuevas,
      fotosEliminar: this.fotosEliminar,
    };

    this.dialogRef.close(result);
  }

  cerrar(): void { this.dialogRef.close(null); }

  getImageUrl(ruta: string): string {
    return `http://localhost:3000/${ruta}`;
  }

  etiquetaMedida(m: Medida): string {
    return `${m.tipoPrenda || 'Sin tipo'} – Pecho ${m.pecho ?? '?'} / Cintura ${m.cintura ?? '?'}`;
  }
}
