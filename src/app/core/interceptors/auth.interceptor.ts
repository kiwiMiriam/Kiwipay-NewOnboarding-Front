import { Injectable } from '@angular/core';
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
import { SKIP_AUTH_TOKEN } from './skip-auth.context';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Si el contexto indica que se debe saltar la autenticación, pasar la request sin modificar
    if (request.context.get(SKIP_AUTH_TOKEN)) {
      return next.handle(request);
    }

    const token = localStorage.getItem('auth_token');

    if (token) {
      // Clone the request and add the token
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
