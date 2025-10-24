import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },

  // Dashboard route (main route after login)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'bandeja',
        loadComponent: () => import('./features/bandeja/bandeja.component').then(m => m.BandejaComponent)
      },
      {
        path: 'nuevo-prospecto',
        children: [
          {
            path: '',
            redirectTo: 'datos-cliente',
            pathMatch: 'full'
          },
          {
            path: 'datos-cliente',
            loadComponent: () => import('./features/prospectos/nuevo-prospecto/datos-cliente/datos-cliente.component')
              .then(m => m.DatosClienteComponent)
          },
          {
            path: 'datos-clinica',
            loadComponent: () => import('./features/prospectos/nuevo-prospecto/datos-clinica/datos-clinica.component')
              .then(m => m.DatosClinicaComponent)
          },
          {
            path: 'cotizador',
            loadComponent: () => import('./features/prospectos/nuevo-prospecto/cotizador/cotizador.component')
              .then(m => m.CotizadorComponent)
          },
          {
            path: 'documentos',
            loadComponent: () => import('./features/prospectos/nuevo-prospecto/documentos/documentos.component')
          },
          {
            path: 'prospecto',
            loadComponent: () => import('./features/prospectos/nuevo-prospecto/prospecto/prospecto')
          }
        ]
      },
      {
        path: '',
        redirectTo: 'bandeja',
        pathMatch: 'full'
      }
    ]
  },

  // Default routes
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'bandeja'
  }
];
