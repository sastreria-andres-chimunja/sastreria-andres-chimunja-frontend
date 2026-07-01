import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Empleado } from '../../../shared/models/Empleado';
import { Medida } from '../../../shared/models/Medida';
import { ImagenService } from '../../../core/services/imagen.service';
import { ItemDialogResult } from '../item-pedido-dialog/item-pedido-dialog.component';

@Component({
  selector: 'app-item-inline-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatTooltipModule,
    TextFieldModule,
  ],
  templateUrl: './item-inline-form.component.html',
  styleUrl: './item-inline-form.component.css',
})
export class ItemInlineFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() empleados: Empleado[] = [];
  @Input() medidas: Medida[] = [];
  @Input() idCliente = 0;
  @Input() idPedido = 0;
  @Input() item: any = null;
  @Input() modoEdicion = false;

  @Output() itemGuardado = new EventEmitter<ItemDialogResult>();
  @Output() cancelarEdicion = new EventEmitter<void>();
  @Output() valorCambiado = new EventEmitter<number>();

  form!: FormGroup;
  medidaForm!: FormGroup;

  modoMedida: 'ninguna' | 'guardada' | 'nueva' = 'ninguna';

  // ── Voz ──────────────────────────────────────────────────────
  escuchando = false;
  private rec: any = null;

  get soportaVoz(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  toggleVoz(): void {
    if (this.escuchando) { this.rec?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.rec = new SR();
    this.rec.lang            = 'es-CO';
    this.rec.continuous      = true;
    this.rec.interimResults  = false;
    this.rec.onresult = (e: any) => {
      let texto = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) texto += e.results[i][0].transcript;
      }
      if (!texto) return;
      const actual = this.form.get('descripcion')?.value ?? '';
      this.form.get('descripcion')?.setValue(actual ? `${actual} ${texto}` : texto);
    };
    this.rec.onend   = () => { this.escuchando = false; };
    this.rec.onerror = () => { this.escuchando = false; };
    this.rec.start();
    this.escuchando = true;
  }

  ngOnDestroy(): void { this.rec?.stop(); }
  tipoPrendaNueva = '';

  fotosNuevas: File[] = [];
  fotosPreview: string[] = [];
  fotosEliminar: number[] = [];
  fotosExistentes: any[] = [];

  fotosMedidaSeleccionada: any[] = [];
  cargandoFotosMedida = false;

  fotosNuevaMedida: File[] = [];
  fotosPreviewNuevaMedida: string[] = [];
  isDraggingMedida = false;

  medidaSeleccionada: Medida | null = null;

  readonly camposMedida = [
    { key: 'espalda',        label: 'Espalda' },
    { key: 'hombro',         label: 'Hombro' },
    { key: 'talleDelantero', label: 'Talle delantero' },
    { key: 'talleTrasero',   label: 'Talle trasero' },
    { key: 'distancia',      label: 'Distancia' },
    { key: 'separacion',     label: 'Separación' },
    { key: 'pecho',          label: 'Pecho' },
    { key: 'cintura',        label: 'Cintura' },
    { key: 'largo',          label: 'Largo' },
    { key: 'largoManga',     label: 'Largo manga' },
    { key: 'anchoManga',     label: 'Ancho manga' },
    { key: 'escote',         label: 'Escote' },
    { key: 'base',           label: 'Base' },
    { key: 'tiro',           label: 'Tiro' },
    { key: 'pierna',         label: 'Pierna' },
    { key: 'rodilla',        label: 'Rodilla' },
    { key: 'bota',           label: 'Bota' },
  ];

  constructor(private fb: FormBuilder, private imagenService: ImagenService) {}

  ngOnInit(): void {
    this.buildForms();
    if (this.item?.idMedida) {
      this.modoMedida = 'guardada';
      this.medidaSeleccionada = this.medidas.find(m => m.idMedida === this.item.idMedida) ?? null;
      this.cargarFotosMedida(this.item.idMedida);
    }
    this.fotosExistentes = this.item?._fotos ?? [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item'] && !changes['item'].firstChange && this.form) {
      this.cargarItemEnForm();
    }
  }

  private buildForms(): void {
    const it = this.item ?? {};
    this.form = this.fb.group({
      descripcion:      [it.descripcion ?? '', Validators.required],
      valor:            [it.valor ?? '', [Validators.required, Validators.min(0)]],
      idEmpleado:       [it.idEmpleado ?? null],
      idMedidaGuardada: [it.idMedida ?? null],
    });

    if (!this.modoEdicion) {
      this.form.get('valor')?.valueChanges.subscribe(v => {
        this.valorCambiado.emit(Number(v) || 0);
      });
    }

    const medidaFields: Record<string, any> = {
      tipoPrenda:    ['', Validators.required],
      otros:         [0],
      observaciones: [''],
    };
    this.camposMedida.forEach(c => { medidaFields[c.key] = [0]; });
    this.medidaForm = this.fb.group(medidaFields);
  }

  private cargarItemEnForm(): void {
    const it = this.item ?? {};
    this.form.patchValue({
      descripcion:      it.descripcion ?? '',
      valor:            it.valor ?? '',
      idEmpleado:       it.idEmpleado ?? null,
      idMedidaGuardada: it.idMedida ?? null,
    });
    if (it.idMedida) {
      this.modoMedida = 'guardada';
      this.medidaSeleccionada = this.medidas.find(m => m.idMedida === it.idMedida) ?? null;
    } else {
      this.modoMedida = 'ninguna';
      this.medidaSeleccionada = null;
    }
    this.fotosExistentes = it._fotos ?? [];
    this.fotosNuevas = [];
    this.fotosPreview = [];
    this.fotosEliminar = [];
    this.fotosNuevaMedida = [];
    this.fotosPreviewNuevaMedida = [];
  }

  resetForm(): void {
    this.valorCambiado.emit(0);
    this.modoMedida = 'ninguna';
    this.tipoPrendaNueva = '';
    this.fotosNuevas = [];
    this.fotosPreview = [];
    this.fotosEliminar = [];
    this.fotosExistentes = [];
    this.fotosMedidaSeleccionada = [];
    this.fotosNuevaMedida = [];
    this.fotosPreviewNuevaMedida = [];
    this.medidaSeleccionada = null;
    this.buildForms();
  }

  onModoChange(): void {
    this.form.patchValue({ idMedidaGuardada: null });
    this.medidaSeleccionada = null;
    this.fotosMedidaSeleccionada = [];
    this.medidaForm.reset({ tipoPrenda: '' });
    this.tipoPrendaNueva = '';
    this.fotosNuevaMedida = [];
    this.fotosPreviewNuevaMedida = [];
  }

  onMedidaSeleccionadaChange(idMedida: number | null): void {
    this.fotosMedidaSeleccionada = [];
    this.medidaSeleccionada = idMedida ? (this.medidas.find(m => m.idMedida === idMedida) ?? null) : null;
    if (idMedida) this.cargarFotosMedida(idMedida);
  }

  cargarFotosMedida(idMedida: number): void {
    this.cargandoFotosMedida = true;
    this.imagenService.listarPorReferencia('Medida', idMedida).subscribe({
      next: (imgs: any) => {
        this.fotosMedidaSeleccionada = Array.isArray(imgs) ? imgs : (imgs?.imagenes ?? []);
        this.cargandoFotosMedida = false;
      },
      error: () => { this.cargandoFotosMedida = false; },
    });
  }

  seleccionarTipoPrenda(tipo: string): void {
    const esNuevoTipo = this.tipoPrendaNueva !== tipo;
    this.tipoPrendaNueva = tipo;
    this.medidaForm.patchValue({ tipoPrenda: tipo });
    if (esNuevoTipo) {
      const reset: Record<string, number> = {};
      this.camposMedida.forEach(c => { reset[c.key] = 0; });
      reset['otros'] = 0;
      this.medidaForm.patchValue(reset);
      this.fotosNuevaMedida = [];
      this.fotosPreviewNuevaMedida = [];
    }
  }

  onFileChange(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    files.forEach(f => {
      this.fotosNuevas.push(f);
      const reader = new FileReader();
      reader.onload = e => this.fotosPreview.push(e.target!.result as string);
      reader.readAsDataURL(f);
    });
  }

  eliminarFotoNueva(i: number): void {
    this.fotosNuevas.splice(i, 1);
    this.fotosPreview.splice(i, 1);
  }

  marcarFotoParaEliminar(idImagen: number): void {
    this.fotosEliminar.push(idImagen);
    this.fotosExistentes = this.fotosExistentes.filter(f => f.idImagen !== idImagen);
  }

  onFileMedidaChange(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.procesarFotosMedida(files);
  }

  onDragOverMedida(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingMedida = true;
  }

  onDropMedida(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingMedida = false;
    const files = event.dataTransfer?.files;
    if (files) this.procesarFotosMedida(Array.from(files));
  }

  procesarFotosMedida(files: File[]): void {
    files.forEach(f => {
      if (!f.type.startsWith('image/')) return;
      this.fotosNuevaMedida.push(f);
      const reader = new FileReader();
      reader.onload = e => this.fotosPreviewNuevaMedida.push(e.target?.result as string);
      reader.readAsDataURL(f);
    });
  }

  eliminarFotoNuevaMedida(i: number): void {
    this.fotosNuevaMedida.splice(i, 1);
    this.fotosPreviewNuevaMedida.splice(i, 1);
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.modoMedida === 'nueva' && this.medidaForm.invalid) {
      this.medidaForm.markAllAsTouched();
      return;
    }

    const formVal = this.form.value;
    const result: ItemDialogResult = {
      item: {
        ...this.item,
        idPedido:    this.idPedido,
        descripcion: formVal.descripcion,
        valor:       formVal.valor,
        idEmpleado:  formVal.idEmpleado || null,
        idMedida:    this.modoMedida === 'guardada' ? formVal.idMedidaGuardada : null,
      },
      nuevaMedida: this.modoMedida === 'nueva'
        ? { ...this.medidaForm.value, idCliente: this.idCliente }
        : null,
      fotosNuevas:      this.fotosNuevas,
      fotosEliminar:    this.fotosEliminar,
      fotosNuevaMedida: this.fotosNuevaMedida,
    };

    this.itemGuardado.emit(result);
    if (!this.modoEdicion) this.resetForm();
  }

  cancelar(): void { this.cancelarEdicion.emit(); }

  obtenerResultadoSiValido(): ItemDialogResult | null {
    const desc = this.form.get('descripcion')?.value?.trim();
    if (!desc) return null;
    if (this.form.invalid) { this.form.markAllAsTouched(); return null; }
    if (this.modoMedida === 'nueva' && this.medidaForm.invalid) { this.medidaForm.markAllAsTouched(); return null; }

    const formVal = this.form.value;
    return {
      item: {
        idPedido:    this.idPedido,
        descripcion: formVal.descripcion,
        valor:       formVal.valor,
        idEmpleado:  formVal.idEmpleado || null,
        idMedida:    this.modoMedida === 'guardada' ? formVal.idMedidaGuardada : null,
      },
      nuevaMedida:      this.modoMedida === 'nueva' ? { ...this.medidaForm.value, idCliente: this.idCliente } : null,
      fotosNuevas:      this.fotosNuevas,
      fotosEliminar:    this.fotosEliminar,
      fotosNuevaMedida: this.fotosNuevaMedida,
    };
  }

  getImageUrl(ruta: string): string { return `http://localhost:3000/${ruta}`; }

  etiquetaMedida(m: Medida): string {
    return `${m.tipoPrenda || 'Sin tipo'} – Pecho ${m.pecho ?? '?'} / Cintura ${m.cintura ?? '?'}`;
  }

  valorMedida(key: string): number | null {
    if (!this.medidaSeleccionada) return null;
    return (this.medidaSeleccionada as any)[key] ?? null;
  }
}
