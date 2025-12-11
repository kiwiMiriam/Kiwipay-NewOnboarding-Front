import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  
  // Get the required section from route data
  const requiredSection = route.data['section'] as string;
  
  if (!authService.isLoggedIn()) {
    toastService.error('Debe iniciar sesión para acceder a esta página');
    return router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
  }
  
  // If no specific section is required, allow access
  if (!requiredSection) {
    return true;
  }
  
  // Check if user can access the section
  if (authService.canAccessSection(requiredSection)) {
    return true;
  }
  
  // User doesn't have permission for this section
  toastService.error('No tiene permisos para acceder a esta página');
  return router.createUrlTree(['/dashboard']);
};