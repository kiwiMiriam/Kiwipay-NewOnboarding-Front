import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If the user is already authenticated, redirect to dashboard
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  // Allow access to the route if not authenticated
  return true;
};