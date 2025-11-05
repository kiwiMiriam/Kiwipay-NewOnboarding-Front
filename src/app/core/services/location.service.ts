import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '@src/environments/environment';
import { EndPoints } from '@src/config/end_points';

export interface Department {
  id: string;
  nombre: string;
}

export interface Province {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface District {
  id: string;
  nombre: string;
  provinciaId: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly API_URL = environment.kiwiPayApi;
  private readonly USE_MOCK = environment.useMockApi;

  constructor(private http: HttpClient) {}

  // Mock data for departments
  private mockDepartments: Department[] = [
    { id: '1', nombre: 'Lima' },
    { id: '2', nombre: 'Arequipa' },
    { id: '3', nombre: 'Cusco' },
    { id: '4', nombre: 'Trujillo' },
    { id: '5', nombre: 'Piura' },
    { id: '6', nombre: 'Chiclayo' }
  ];

  // Mock data for provinces
  private mockProvinces: Province[] = [
    { id: '1', nombre: 'Lima', departamentoId: '1' },
    { id: '2', nombre: 'Callao', departamentoId: '1' },
    { id: '3', nombre: 'Arequipa', departamentoId: '2' },
    { id: '4', nombre: 'Cayma', departamentoId: '2' },
    { id: '5', nombre: 'Cusco', departamentoId: '3' },
    { id: '6', nombre: 'Sicuani', departamentoId: '3' },
    { id: '7', nombre: 'Trujillo', departamentoId: '4' },
    { id: '8', nombre: 'Chepén', departamentoId: '4' },
    { id: '9', nombre: 'Piura', departamentoId: '5' },
    { id: '10', nombre: 'Sullana', departamentoId: '5' },
    { id: '11', nombre: 'Chiclayo', departamentoId: '6' },
    { id: '12', nombre: 'Lambayeque', departamentoId: '6' }
  ];

  // Mock data for districts
  private mockDistricts: District[] = [
    { id: '1', nombre: 'Miraflores', provinciaId: '1' },
    { id: '2', nombre: 'San Isidro', provinciaId: '1' },
    { id: '3', nombre: 'Surco', provinciaId: '1' },
    { id: '4', nombre: 'La Molina', provinciaId: '1' },
    { id: '5', nombre: 'Callao', provinciaId: '2' },
    { id: '6', nombre: 'Carmen de la Legua', provinciaId: '2' },
    { id: '7', nombre: 'Arequipa', provinciaId: '3' },
    { id: '8', nombre: 'Yanahuara', provinciaId: '3' },
    { id: '9', nombre: 'Cayma', provinciaId: '4' },
    { id: '10', nombre: 'Sicuani', provinciaId: '6' }
  ];

  getDepartments(): Observable<Department[]> {
    if (this.USE_MOCK) {
      return of(this.mockDepartments).pipe(delay(300));
    }

    return this.http.get<any>(`${this.API_URL}${EndPoints.KIWIPAY.GET_DEPARTMENTS}`).pipe(
      map(response => {
        // Adapt response based on API structure
        if (Array.isArray(response)) {
          return response;
        }
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return response.departments || [];
      }),
      catchError(error => {
        console.error('Error fetching departments:', error);
        // Fallback to mock on error
        return of(this.mockDepartments);
      })
    );
  }

  getProvinces(departamentoId: string): Observable<Province[]> {
    if (this.USE_MOCK) {
      const provinces = this.mockProvinces.filter(p => p.departamentoId === departamentoId);
      return of(provinces).pipe(delay(300));
    }

    return this.http.get<any>(`${this.API_URL}${EndPoints.KIWIPAY.GET_PROVINCES}`, {
      params: { departamentoId }
    }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return response.provinces || [];
      }),
      catchError(error => {
        console.error('Error fetching provinces:', error);
        // Fallback to mock on error
        const provinces = this.mockProvinces.filter(p => p.departamentoId === departamentoId);
        return of(provinces);
      })
    );
  }

  getDistricts(provinciaId: string): Observable<District[]> {
    if (this.USE_MOCK) {
      const districts = this.mockDistricts.filter(d => d.provinciaId === provinciaId);
      return of(districts).pipe(delay(300));
    }

    return this.http.get<any>(`${this.API_URL}${EndPoints.KIWIPAY.GET_DISTRICTS}`, {
      params: { provinciaId }
    }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return response.districts || [];
      }),
      catchError(error => {
        console.error('Error fetching districts:', error);
        // Fallback to mock on error
        const districts = this.mockDistricts.filter(d => d.provinciaId === provinciaId);
        return of(districts);
      })
    );
  }
}

