import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

// Create an auth interceptor function
const authInterceptor = (req: any, next: any) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Core Angular providers
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router configuration
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions()
    ),

    // HTTP configuration with interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),

    // Animation support - async loading for better performance
    provideAnimations()
  ]
};
