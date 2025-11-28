import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '@src/environments/environment';
import { EndPoints } from '@src/config/end_points';

export interface Department {
  id: string;
  name: string;
}

export interface Province {
  id: string;
  name: string;
  departmentId: string;
}

export interface District {
  id: string;
  name: string;
  provinceId: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly API_URL = environment.kiwiPayApi + '/api/v1';

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    /*if (this.USE_MOCK) {
      return of(this.mockDepartments).pipe(delay(300));
    }*/

    return this.http.get<{ data: Department[] }>(`${this.API_URL}/departments`).pipe(
      map(res => res.data),
      catchError(error => {
        console.error('Error fetching departments:', error);
        return throwError(() => error);
      })
    );
  }

  getProvinces(departamentoId: string): Observable<Province[]> {
    /*if (this.USE_MOCK) {
      const provinces = this.mockProvinces.filter(p => p.departamentoId === departamentoId);
      return of(provinces).pipe(delay(300));
    }*/

    return this.http.get<{ data: Province[] }>(`${this.API_URL}/provinces?departmentId=${departamentoId}`)
      .pipe(
        map(res => res.data),
        catchError(error => {
          console.error('Error fetching provinces:', error);
          return throwError(() => error);
        })
      );
  }

  getDistricts(provinciaId: string): Observable<District[]> {
    /*if (this.USE_MOCK) {
      const districts = this.mockDistricts.filter(d => d.provinciaId === provinciaId);
      return of(districts).pipe(delay(300));
    }*/

    return this.http.get<{ data: District[] }>(`${this.API_URL}/districts?provinceId=${provinciaId}`)
      .pipe(
        map(res => res.data),
        catchError(error => {
          console.error('Error fetching districts:', error);
          return throwError(() => error);
        })
      );
  }
}

