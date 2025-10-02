import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';

import { User } from '../models/user.model';
import { AuthState, LoginRequest, LoginResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// Auth API configuration from environment
const API_URL = environment.authApi;
const USE_MOCK_API = environment.useMockApi;
const TOKEN_EXPIRATION_TIME = environment.tokenExpirationTime;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use Angular's signal API for reactive state management
  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Public read-only computed signals
  public user = computed(() => this.authState().user);
  public isAuthenticated = computed(() => this.authState().isAuthenticated);
  public isLoading = computed(() => this.authState().isLoading);
  public error = computed(() => this.authState().error);

  // For token refresh
  private tokenExpirationTimer: any;
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkToken();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.authState.update(state => ({ ...state, isLoading: true, error: null }));

    if (USE_MOCK_API) {
      return this.mockLogin(credentials);
    } else {
      return this.apiLogin(credentials);
    }
  }

  private apiLogin(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.token) {
          this.handleSuccessfulLogin(response);
        }
      }),
      catchError(error => {
        this.handleLoginError(error);
        return throwError(() => error);
      }),
      map(response => {
        this.authState.update(state => ({ ...state, isLoading: false }));
        return response;
      })
    );
  }

  private mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    // Simple mock for testing - in a real app, you might have more complex mocks
    return of({
      success: credentials.username === 'admin' && credentials.password === 'password',
      user: {
        id: '1',
        username: credentials.username,
        fullName: 'Admin User',
        email: 'admin@kiwiplan.com',
        role: 'admin'
      },
      token: 'mock-jwt-token-would-be-here'
    }).pipe(
      delay(1500), // Simulate network delay
      tap((response) => {
        if (response.success) {
          this.handleSuccessfulLogin(response);
        } else {
          this.authState.update(state => ({
            ...state,
            isLoading: false,
            error: 'Invalid username or password'
          }));
        }
      }),
      catchError(error => {
        this.handleLoginError(error);
        return throwError(() => error);
      })
    );
  }

  private handleSuccessfulLogin(response: LoginResponse): void {
    const user: User = {
      ...response.user,
      token: response.token
    };

    // Store token in localStorage
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set expiration time
    const expirationDate = new Date(new Date().getTime() + TOKEN_EXPIRATION_TIME);
    localStorage.setItem('token_expiration', expirationDate.toISOString());

    // Update state
    this.authState.update(state => ({
      ...state,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    }));

    // Setup auto refresh
    this.autoRefreshToken(TOKEN_EXPIRATION_TIME);

    // Navigate to dashboard or home
    this.router.navigate(['/dashboard']);
  }

  private handleLoginError(error: any): void {
    console.error('Login error', error);
    
    this.authState.update(state => ({
      ...state,
      isLoading: false,
      error: error.error?.message || error.message || 'Login failed. Please try again.'
    }));
  }

  logout(): void {
    // Clear stored auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiration');

    // Clear the token refresh timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    // Reset auth state
    this.authState.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false,
      error: null
    }));

    // Navigate to login
    this.router.navigate(['/login']);
  }

  private autoRefreshToken(expirationDuration: number): void {
    // Clear any existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    // Set timer to refresh token before expiration (refresh at 80% of expiration time)
    this.tokenExpirationTimer = setTimeout(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().subscribe({
          next: (response) => {
            console.log('Token refreshed successfully');
          },
          error: (error) => {
            console.error('Token refresh failed', error);
            // If refresh fails, logout user
            this.logout();
          }
        });
      }
    }, expirationDuration * 0.8);
  }

  refreshToken(): Observable<LoginResponse> {
    // In mock mode, simulate a successful refresh
    if (USE_MOCK_API) {
      return of({
        success: true,
        user: this.user() as any,
        token: 'new-mock-jwt-token-' + new Date().getTime()
      }).pipe(
        delay(300),
        tap((response) => {
          if (response.success) {
            // Update token
            const user = this.user() as User;
            user.token = response.token;
            
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update expiration
            const expirationDate = new Date(new Date().getTime() + TOKEN_EXPIRATION_TIME);
            localStorage.setItem('token_expiration', expirationDate.toISOString());
            
            // Setup next auto refresh
            this.autoRefreshToken(TOKEN_EXPIRATION_TIME);
            
            this.authState.update(state => ({
              ...state,
              user
            }));
          }
        })
      );
    }
    
    // In real API mode, call the refresh endpoint
    return this.http.post<LoginResponse>(`${API_URL}/refresh`, {
      token: localStorage.getItem('auth_token')
    }).pipe(
      tap((response) => {
        if (response.success && response.token) {
          // Update token
          const user = this.user() as User;
          user.token = response.token;
          
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update expiration
          const expirationDate = new Date(new Date().getTime() + TOKEN_EXPIRATION_TIME);
          localStorage.setItem('token_expiration', expirationDate.toISOString());
          
          // Setup next auto refresh
          this.autoRefreshToken(TOKEN_EXPIRATION_TIME);
          
          this.authState.update(state => ({
            ...state,
            user
          }));
        }
      }),
      catchError(error => {
        console.error('Error refreshing token:', error);
        return throwError(() => error);
      })
    );
  }

  private checkToken(): void {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    const expirationDateStr = localStorage.getItem('token_expiration');
    
    if (token && userData && expirationDateStr) {
      try {
        const user = JSON.parse(userData);
        const expirationDate = new Date(expirationDateStr);
        
        // Check if token is expired
        if (expirationDate > new Date()) {
          // Token still valid
          this.authState.update(state => ({
            ...state,
            user,
            isAuthenticated: true
          }));
          
          // Setup auto refresh for remaining time
          const remainingTime = expirationDate.getTime() - new Date().getTime();
          this.autoRefreshToken(remainingTime);
        } else {
          // Token expired, logout user
          console.log('Token expired, logging out');
          this.logout();
        }
      } catch (e) {
        console.error('Error parsing stored user data', e);
        this.logout();
      }
    }
  }

  // Additional methods for token refresh, validation, etc. would go here
}