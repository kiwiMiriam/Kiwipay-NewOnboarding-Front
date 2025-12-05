import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProspectoApiService, PacienteData } from './prospecto-api.service';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  constructor(private prospectoApiService: ProspectoApiService) {}

  /**
   * Obtiene todos los pacientes de un cliente
   */
  getPacientesByClientId(clientId: number): Observable<PacienteData[]> {
    return this.prospectoApiService.getPatients(clientId).pipe(
      catchError(error => {
        console.error('Error fetching patients:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene un paciente específico
   */
  getPacienteById(clientId: number, patientId: number): Observable<PacienteData | null> {
    return this.prospectoApiService.getPatientById(clientId, patientId).pipe(
      catchError(error => {
        console.error('Error fetching patient:', error);
        return of(null);
      })
    );
  }

  /**
   * Crea un nuevo paciente
   */
  crearPaciente(clientId: number, pacienteData: PacienteData): Observable<PacienteData> {
    return this.prospectoApiService.createPatient(clientId, pacienteData);
  }

  /**
   * Actualiza un paciente existente
   */
  actualizarPaciente(clientId: number, patientId: number, pacienteData: PacienteData): Observable<PacienteData> {
    return this.prospectoApiService.updatePatient(clientId, patientId, pacienteData);
  }

  /**
   * Elimina un paciente
   */
  eliminarPaciente(clientId: number, patientId: number): Observable<boolean> {
    return this.prospectoApiService.deletePatient(clientId, patientId).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting patient:', error);
        return of(false);
      })
    );
  }
}