import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { LoginRequest, LoginResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'kiwipay_token';
  private readonly USER_KEY = 'kiwipay_user';
  private readonly API_URL = 'http://localhost:8080/api/v1';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signals para el estado
  isLoading = signal(false);
  user = signal<User | null>(this.getUserFromStorage());

  // Mapeo de permisos por sección
  private sectionPermissions = {
    DASHBOARD: ['SUPERADMIN', 'COMERCIAL', 'ADV', 'RIESGOS'], // SIEMPRE habilitado
    CLIENTES: ['SUPERADMIN', 'COMERCIAL'],
    CLINICAS: ['SUPERADMIN', 'COMERCIAL'],
    COTIZADOR: ['SUPERADMIN', 'COMERCIAL'],
    DOCUMENTOS: ['SUPERADMIN', 'ADV', 'COMERCIAL'],
    ADV: ['SUPERADMIN', 'ADV'],
    PROSPECTO: ['SUPERADMIN', 'RIESGOS']
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Validar token al iniciar si existe
    if (this.getToken()) {
      this.validateToken().subscribe({
        next: () => {}, // Token válido
        error: () => this.logout() // Token inválido, logout
      });
    }
  }

  /**
   * Login usando el endpoint real POST /api/v1/auth/login
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token y datos del usuario
          this.setToken(response.token);
          const user: User = {
            username: response.username,
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            roles: response.roles,
            fullName: `${response.firstName} ${response.lastName}`
          };
          this.setUser(user);
          this.currentUserSubject.next(user);
          this.user.set(user);
          this.isLoading.set(false);
        }),
        catchError(error => {
          this.isLoading.set(false);
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validar token usando GET /api/v1/auth/validate
   */
  validateToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    return this.http.get(`${this.API_URL}/auth/validate`)
      .pipe(
        catchError(error => {
          console.error('Token validation failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout - eliminar token y datos del usuario
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Obtener roles del usuario actual
   */
  getUserRoles(): string[] {
    const user = this.getUserFromStorage();
    return user ? user.roles : [];
  }

  /**
   * Verificar si el usuario está logueado
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getUserFromStorage();
  }

  /**
   * Verificar si el usuario tiene permiso para una sección específica
   */
  canAccessSection(section: string): boolean {
    const userRoles = this.getUserRoles();
    const allowedRoles = this.sectionPermissions[section as keyof typeof this.sectionPermissions];
    
    if (!allowedRoles) return false;
    
    return userRoles.some(role => allowedRoles.includes(role));
  }

  /**
   * Obtener la primera sección permitida para el usuario actual
   * Útil para redirecciones automáticas según permisos
   */
  getFirstAllowedSection(): string {
    const userRoles = this.getUserRoles();
    
    // Definir orden de prioridad para las secciones
    const sectionOrder = ['CLIENTES', 'CLINICAS', 'COTIZADOR', 'DOCUMENTOS', 'ADV', 'PROSPECTO'];
    
    for (const section of sectionOrder) {
      const allowedRoles = this.sectionPermissions[section as keyof typeof this.sectionPermissions];
      if (allowedRoles && userRoles.some(role => allowedRoles.includes(role))) {
        return section;
      }
    }
    
    // Si no tiene acceso a ninguna sección específica, regresar DASHBOARD
    return 'DASHBOARD';
  }

  /**
   * Obtener la ruta correspondiente a la primera sección permitida
   */
  getFirstAllowedRoute(): string {
    const section = this.getFirstAllowedSection();
    
    const routeMap: {[key: string]: string} = {
      'CLIENTES': '/dashboard/nuevo-prospecto/datos-cliente',
      'CLINICAS': '/dashboard/nuevo-prospecto/datos-clinica', 
      'COTIZADOR': '/dashboard/nuevo-prospecto/cotizador',
      'DOCUMENTOS': '/dashboard/nuevo-prospecto/documentos',
      'ADV': '/dashboard/nuevo-prospecto/adv-documentos',
      'PROSPECTO': '/dashboard/nuevo-prospecto/prospecto',
      'DASHBOARD': '/dashboard/bandeja'
    };
    
    return routeMap[section] || '/dashboard/bandeja';
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.getUserFromStorage();
  }

  /**
   * Obtener token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guardar token en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtener usuario del localStorage
   */
  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Métodos legacy para compatibilidad
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }
}