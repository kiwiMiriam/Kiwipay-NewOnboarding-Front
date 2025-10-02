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
    canActivate: [noAuthGuard] // Only accessible if NOT authenticated
  },

  // Authenticated routes
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'datos-clientes',
        pathMatch: 'full'
      },
      {
        path: 'datos-clientes',
        loadComponent: () => import('./features/prospectos/nuevo-prospecto/datos-cliente/datos-cliente.component').then(m => m.DatosClienteComponent)
      },
      {
        path: 'datos-clinicas',
        loadComponent: () => import('./features/prospectos/nuevo-prospecto/datos-clinica/datos-clinica.component').then(m => m.DatosClinicaComponent)
      },
      {
        path: 'cotizador',
        loadComponent: () => import('./features/prospectos/nuevo-prospecto/cotizador/cotizador.component').then(m => m.CotizadorComponent)
      },
      {
        path: 'documentos',
        loadComponent: () => import('./features/prospectos/nuevo-prospecto/documentos/documentos.component').then(m => m.DocumentosComponent)
      }
    ]
  },

  // Example of a route with role-based access
  {
    path: 'admin',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [roleGuard],
    data: {
      requiredRole: 'admin'
    }
  },

  // Default routes
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
