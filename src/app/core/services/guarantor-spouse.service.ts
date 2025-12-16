import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';

export interface GuarantorSpouseData {
  id?: number;
  guarantorId?: string;
  documentType: string;
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGuarantorSpouseRequest {
  documentType: string;
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  email?: string;
  phone?: string;
}

export interface UpdateGuarantorSpouseRequest {
  documentType?: string;
  documentNumber?: string;
  firstNames?: string;
  lastNames?: string;
  email?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GuarantorSpouseService {
  private baseUrl = `${environment.kiwiPayApi}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Crear cónyuge del aval
   */
  createGuarantorSpouse(guarantorId: string, data: CreateGuarantorSpouseRequest): Observable<GuarantorSpouseData> {
    return this.http.post<GuarantorSpouseData>(`${this.baseUrl}/guarantors/${guarantorId}/spouse`, data);
  }

  /**
   * Actualizar cónyuge del aval
   */
  updateGuarantorSpouse(guarantorId: string, data: UpdateGuarantorSpouseRequest): Observable<GuarantorSpouseData> {
    return this.http.put<GuarantorSpouseData>(`${this.baseUrl}/guarantors/${guarantorId}/spouse`, data);
  }

  /**
   * Obtener cónyuge del aval
   */
  getGuarantorSpouse(guarantorId: string): Observable<GuarantorSpouseData> {
    return this.http.get<GuarantorSpouseData>(`${this.baseUrl}/guarantors/${guarantorId}/spouse`);
  }
}