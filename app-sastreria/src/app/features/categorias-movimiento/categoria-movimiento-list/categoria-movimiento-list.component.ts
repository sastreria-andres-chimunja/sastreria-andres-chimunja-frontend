import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CategoriaMovimientoService } from '../../../core/services/categoria-movimiento.service';
import { CategoriaMovimiento } from '../../../shared/models/CategoriaMovimiento';

@Component({
  selector: 'app-categoria-movimiento-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './categoria-movimiento-list.component.html',
  styleUrl: './categoria-movimiento-list.component.css',
})
export class CategoriaMovimientoListComponent implements OnInit {
  categorias: CategoriaMovimiento[] = [];

  constructor(private categoriaMovimientoService: CategoriaMovimientoService) {}

  ngOnInit() { this.loadCategorias(); }

  loadCategorias() {
    this.categoriaMovimientoService.listarCategoriasMovimiento().subscribe((resp: any) => {
      this.categorias = resp.categoriasMovimiento ?? [];
    });
  }

  iconoPorCategoria(nombre: string): string {
    const n = (nombre ?? '').toLowerCase();
    if (n.includes('nom')) return 'engineering';
    if (n.includes('ped')) return 'receipt_long';
    return 'shopping_cart';
  }
}
