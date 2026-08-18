import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Empleado } from '../../../shared/models/Empleado';
import { Medida } from '../../../shared/models/Medida';
import { stringToDate } from '../../../utils/date.utils';
import { ImagenService } from '../../../core/services/imagen.service';
import { EstadoService } from '../../../core/services/estado.service';

export interface ItemDialogData {
  item?: any;
  idPedido: number;
  idCliente: number;
  empleados: Empleado[];
  medidas: Medida[];
  imagenes?: any[];
}

export interface ItemDialogResult {
  item: any;
  nuevaMedida: any | null;
  fotosNuevas: File[];
  fotosEliminar: number[];
  fotosNuevaMedida: File[];
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
    MatButtonModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTooltipModule,
    TextFieldModule,
  ],
  templateUrl: './item-pedido-dialog.component.html',
  styleUrl: './item-pedido-dialog.component.css',
})
export class ItemPedidoDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  medidaForm!: FormGroup;

  modoMedida: 'ninguna' | 'guardada' | 'nueva' = 'ninguna';
  estados: any[] = [];

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
  isEdit = false;

  // fotos del ítem
  fotosNuevas: File[] = [];
  fotosPreview: string[] = [];
  fotosEliminar: number[] = [];
  fotosExistentes: any[] = [];

  // fotos de la medida seleccionada (solo visualización)
  fotosMedidaSeleccionada: any[] = [];
  cargandoFotosMedida = false;

  // fotos de la nueva medida
  fotosNuevaMedida: File[] = [];
  fotosPreviewNuevaMedida: string[] = [];
  isDraggingMedida = false;

  // medida seleccionada completa (para mostrar campos)
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

  readonly camposCamisa = ['espalda','hombro','talleDelantero','talleTrasero','distancia','separacion','pecho','cintura','base','largo','largoManga','anchoManga','escote'];
  readonly camposPantalon = ['cintura','base','tiro','pierna','rodilla','bota','largo'];

  constructor(
    public dialogRef: MatDialogRef<ItemPedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ItemDialogData,
    private fb: FormBuilder,
    private imagenService: ImagenService,
    private estadoService: EstadoService,
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data.item?.idItemPedido;
    this.fotosExistentes = this.data.imagenes ?? [];

    if (this.data.item?.idMedida) {
      this.modoMedida = 'guardada';
      this.medidaSeleccionada = this.data.medidas.find(m => m.idMedida === this.data.item.idMedida) ?? null;
    }

    this.estadoService.listar().subscribe({
      next: (res: any) => { this.estados = Array.isArray(res) ? res : (res?.estados ?? []); },
    });

    this.buildForms();

    if (this.data.item?.idMedida) {
      this.cargarFotosMedida(this.data.item.idMedida);
    }
  }

  private buildForms(): void {
    const item = this.data.item ?? {};
    this.form = this.fb.group({
      descripcion:       [item.descripcion ?? '', Validators.required],
      valor:             [item.valor ?? '', [Validators.required, Validators.min(0)]],
      comisionEmpleado:  [item.comisionEmpleado ?? 0],
      idEstado:          [item.idEstado ?? null],
      fechaEntrega:      [item.fechaEntrega ? stringToDate(item.fechaEntrega) : new Date(), Validators.required],
      observacion:       [item.observacion ?? ''],
      idEmpleado:        [item.idEmpleado ?? null],
      idMedidaGuardada:  [item.idMedida ?? null],
    });

    const medidaFields: Record<string, any> = {
      tipoPrenda:    ['', Validators.required],
      otros:         [0],
      observaciones: [''],
    };
    this.camposMedida.forEach(c => { medidaFields[c.key] = [0]; });
    this.medidaForm = this.fb.group(medidaFields);

    // Al elegir/quitar el "Empleado encargado" acá, el Estado debe seguir el
    // mismo criterio automático que ya usa "Asignar empleado" (el botón
    // masivo de toda la hoja de trabajo): Pendiente -> Asignado al asignar,
    // Asignado -> Pendiente al desasignar. Si no, un ítem asignado
    // individualmente desde este diálogo se quedaba con el Estado viejo
    // (normalmente Pendiente) porque el campo Estado no se tocaba, y por
    // eso nunca aparecía en "Mis ítems" (esa vista oculta los Pendiente).
    // Solo actúa entre Pendiente/Asignado -- nunca pisa Terminado/
    // Entregado/No realizado, que son cambios manuales deliberados.
    this.form.get('idEmpleado')!.valueChanges.subscribe((nuevoIdEmpleado) => {
      const idPendiente = this.estados.find(e => e.nombre.toLowerCase() === 'pendiente')?.idEstado;
      const idAsignado  = this.estados.find(e => e.nombre.toLowerCase() === 'asignado')?.idEstado;
      const estadoActual = this.form.get('idEstado')!.value;
      if (nuevoIdEmpleado && estadoActual === idPendiente && idAsignado != null) {
        this.form.get('idEstado')!.setValue(idAsignado);
      } else if (!nuevoIdEmpleado && estadoActual === idAsignado && idPendiente != null) {
        this.form.get('idEstado')!.setValue(idPendiente);
      }
    });
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
    this.medidaSeleccionada = idMedida ? (this.data.medidas.find(m => m.idMedida === idMedida) ?? null) : null;
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

    if (esNuevoTipo && !this.isEdit) {
      const reset: Record<string, number> = {};
      this.camposMedida.forEach(c => { reset[c.key] = 0; });
      reset['otros'] = 0;
      this.medidaForm.patchValue(reset);
      this.fotosNuevaMedida = [];
      this.fotosPreviewNuevaMedida = [];
    }
  }

  // ── Fotos ítem ──────────────────────────────────────────────
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

  // ── Fotos nueva medida ──────────────────────────────────────
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

  // ── Guardar ────────────────────────────────────────────────
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.modoMedida === 'nueva' && this.medidaForm.invalid) {
      this.medidaForm.markAllAsTouched();
      return;
    }

    const formVal = this.form.value;
    const item: any = {
      ...this.data.item,
      idPedido:         this.data.idPedido,
      descripcion:      formVal.descripcion,
      valor:            formVal.valor,
      comisionEmpleado: formVal.comisionEmpleado ?? 0,
      idEstado:         formVal.idEstado ?? null,
      observacion:      formVal.observacion,
      idEmpleado:       formVal.idEmpleado || null,
      fechaEntrega:     formVal.fechaEntrega,
      idMedida:         this.modoMedida === 'guardada' ? formVal.idMedidaGuardada : null,
    };

    const result: ItemDialogResult = {
      item,
      nuevaMedida: this.modoMedida === 'nueva'
        ? { ...this.medidaForm.value, idCliente: this.data.idCliente }
        : null,
      fotosNuevas:       this.fotosNuevas,
      fotosEliminar:     this.fotosEliminar,
      fotosNuevaMedida:  this.fotosNuevaMedida,
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

  valorMedida(key: string): number | null {
    if (!this.medidaSeleccionada) return null;
    return (this.medidaSeleccionada as any)[key] ?? null;
  }
}
