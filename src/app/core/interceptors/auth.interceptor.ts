import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpContext
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_TOKEN } from './skip-auth.context';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Si el contexto indica que se debe saltar la autenticación, pasar la request sin modificar
    if (request.context.get(SKIP_AUTH_TOKEN)) {
      return next.handle(request);
    }

    // Obtener token del AuthService
    const token = this.authService.getToken();

    // No agregar token a requests de login
    if (token && !request.url.includes('/auth/login')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          // Manejar errores de autenticación y autorización
          if (error.status === 401 || error.status === 403) {
            console.warn('Token expirado o sin permisos, redirigiendo a login');
            this.authService.logout();
          }
          
          // Manejar errores OPTIONS para evitar "JWT Token has expired"
          if (error.status === 0 && request.method === 'OPTIONS') {
            console.warn('Error en preflight OPTIONS request');
          }
        }
        return throwError(() => error);
      })
    );
  }
}
