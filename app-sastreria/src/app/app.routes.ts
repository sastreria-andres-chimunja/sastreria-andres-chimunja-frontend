import { Routes } from '@angular/router';
import { CrearClienteComponent } from './features/clientes/crear-cliente/crear-cliente.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ClientesListComponent } from './features/clientes/clientes-list/clientes-list.component';
import { MedidasListComponent } from './features/medidas/medidas-list/medidas-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'clientes',
        component: ClientesListComponent,
      },

      {
        path: 'crear-cliente',
        component: CrearClienteComponent,
      },
      {
        path: 'medidas/:id',
        component: MedidasListComponent,
      },
    ],
  },
];
