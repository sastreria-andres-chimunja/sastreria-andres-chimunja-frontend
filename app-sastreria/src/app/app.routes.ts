import { Routes } from '@angular/router';
import { CrearClienteComponent } from './features/clientes/crear-cliente/crear-cliente.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ClientesListComponent } from './features/clientes/clientes-list/clientes-list.component';
import { MedidasListComponent } from './features/medidas/medidas-list/medidas-list.component';
import { EmpleadosListComponent } from './features/empleados/empleados-list/empleados-list.component';
import { MovimientosListComponent } from './features/movimientos/movimientos-list/movimientos-list.component';
import { MetodosPagoListComponent } from './features/metodos-pago/metodos-pago-list/metodos-pago-list.component';
import { TipoMovimientoListComponent } from './features/tipo-movimiento/tipo-movimiento-list/tipo-movimiento-list.component';
import { CategoriaMovimientoListComponent } from './features/categorias-movimiento/categoria-movimiento-list/categoria-movimiento-list.component';
import { RolesListComponent } from './features/roles/roles-list/roles-list.component';
import { NominaGeneralComponent } from './features/nomina/nomina-general/nomina-general.component';
import { LoginComponent } from './features/login/login.component';

// export const routes: Routes = [
//   {
//     path: '',
//     component: MainLayoutComponent,
//     children: [
//       {
//         path: 'clientes',
//         component: ClientesListComponent,
//       },

//       {
//         path: 'crear-cliente',
//         component: CrearClienteComponent,
//       },
//       {
//         path: 'medidas/:id',
//         component: MedidasListComponent,
//       },
//       {
//         path: 'empleados',
//         component: EmpleadosListComponent,
//       },
//       {
//         path: 'movimientos',
//         component: MovimientosListComponent,
//       },
//       {
//         path: 'metodosPago',
//         component: MetodosPagoListComponent,
//       },
//       {
//         path: 'tipoMovimientos',
//         component: TipoMovimientoListComponent,
//       },
//       {
//         path: 'categoriaMovimientos',
//         component: CategoriaMovimientoListComponent,
//       },
//       {
//         path: 'roles',
//         component: RolesListComponent,
//       },
//       {
//         path: 'nomina',
//         component: NominaGeneralComponent,
//       },
//     ],
//   },
// ];

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },

  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: 'app',
    component: MainLayoutComponent,
    children: [
      { path: 'clientes', component: ClientesListComponent },
      { path: 'crear-cliente', component: CrearClienteComponent },
      { path: 'medidas/:id', component: MedidasListComponent },
      { path: 'empleados', component: EmpleadosListComponent },
      { path: 'movimientos', component: MovimientosListComponent },
      { path: 'metodosPago', component: MetodosPagoListComponent },
      { path: 'tipoMovimientos', component: TipoMovimientoListComponent },
      {
        path: 'categoriaMovimientos',
        component: CategoriaMovimientoListComponent,
      },
      { path: 'roles', component: RolesListComponent },
      { path: 'nomina', component: NominaGeneralComponent },

      { path: '', redirectTo: 'clientes', pathMatch: 'full' },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];
