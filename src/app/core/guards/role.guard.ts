import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  
  // Get the required role from route data
  const requiredRole = route.data['requiredRole'] as string;
  
  if (!authService.isAuthenticated()) {
    toastService.error('Debe iniciar sesión para acceder a esta página');
    return router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
  }
  
  // If no specific role is required or user has matching role
  if (!requiredRole || authService.user()?.role === requiredRole) {
    return true;
  }
  
  // User doesn't have the required role
  toastService.error('No tiene permisos para acceder a esta página');
  return router.createUrlTree(['/dashboard']);
};