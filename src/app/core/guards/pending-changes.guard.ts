import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ToastService } from '../../shared/components/toast/toast.service';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<CanComponentDeactivate> = 
  (component, currentRoute, currentState, nextState) => {
    const toastService = inject(ToastService);
    
    // If the component doesn't implement CanComponentDeactivate, allow navigation
    if (!component.canDeactivate) {
      return true;
    }

    // Check if the component allows deactivation
    const result = component.canDeactivate();

    // If result is a Promise, handle it async
    if (result instanceof Promise) {
      return result.then(canDeactivate => {
        if (!canDeactivate) {
          toastService.warning('Hay cambios sin guardar. Por favor guarde o descarte los cambios antes de salir.');
        }
        return canDeactivate;
      });
    }

    // Handle synchronous result
    if (!result) {
      toastService.warning('Hay cambios sin guardar. Por favor guarde o descarte los cambios antes de salir.');
    }
    
    return result;
  };