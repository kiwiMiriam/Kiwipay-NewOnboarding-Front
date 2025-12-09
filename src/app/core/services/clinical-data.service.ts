import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProspectoApiService, ClinicalData, MedicalCategory, Clinic, Branch } from './prospecto-api.service';

@Injectable({
  providedIn: 'root'
})
export class ClinicalDataService {

  constructor(private prospectoApiService: ProspectoApiService) {}

  /**
   * Obtiene todas las categorías médicas
   */
  getMedicalCategories(): Observable<MedicalCategory[]> {
    return this.prospectoApiService.getMedicalCategories().pipe(
      catchError(error => {
        console.error('Error fetching medical categories:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene clínicas por categoría médica
   */
  getClinicsByCategory(categoryId: string): Observable<Clinic[]> {
    return this.prospectoApiService.getClinicsByCategory(categoryId).pipe(
      catchError(error => {
        console.error('Error fetching clinics:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene sedes por clínica
   */
  getBranchesByClinic(clinicId: string): Observable<Branch[]> {
    return this.prospectoApiService.getBranchesByClinic(clinicId).pipe(
      catchError(error => {
        console.error('Error fetching branches:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene datos clínicos de un cliente
   */
  getClinicalDataByClientId(clientId: number): Observable<ClinicalData | null> {
    return this.prospectoApiService.getClinicalData(clientId).pipe(
      catchError(error => {
        console.error('Error fetching clinical data:', error);
        return of(null);
      })
    );
  }

  /**
   * Crea datos clínicos para un cliente
   */
  crearClinicalData(clientId: number, data: ClinicalData): Observable<ClinicalData> {
    return this.prospectoApiService.createClinicalData(clientId, data);
  }

  /**
   * Actualiza datos clínicos de un cliente
   */
  actualizarClinicalData(clientId: number, data: ClinicalData): Observable<ClinicalData> {
    return this.prospectoApiService.updateClinicalData(clientId, data);
  }
}
