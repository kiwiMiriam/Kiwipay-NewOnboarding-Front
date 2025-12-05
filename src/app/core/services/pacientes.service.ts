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
    return this.prospectoApiService.createPatient(clientId, pacienteData).pipe(
      catchError(error => {
        console.error('Error creating patient:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un paciente existente
   */
  actualizarPaciente(clientId: number, patientId: number, pacienteData: PacienteData): Observable<PacienteData> {
    return this.prospectoApiService.updatePatient(clientId, patientId, pacienteData).pipe(
      catchError(error => {
        console.error('Error updating patient:', error);
        throw error;
      })
    );
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

  /**
   * Normaliza los datos del paciente para el frontend
   */
  normalizarPacienteData(paciente: PacienteData): PacienteData {
    return {
      ...paciente,
      // Mapear campos del backend al frontend
      tipoDocumento: paciente.documentType || paciente.tipoDocumento,
      numeroDocumento: paciente.documentNumber || paciente.numeroDocumento,
      nombres: paciente.firstNames || paciente.nombres,
      apellidos: paciente.lastNames || paciente.apellidos,
      sexo: paciente.gender || paciente.sexo,
      telefono: paciente.phone || paciente.telefono,
      correo: paciente.email || paciente.correo,
      departamento: paciente.address?.departmentId || paciente.departamento,
      provincia: paciente.address?.provinceId || paciente.provincia,
      distrito: paciente.address?.districtId || paciente.distrito,
      direccion: paciente.address?.line1 || paciente.direccion
    };
  }

  /**
   * Prepara los datos del paciente para enviar al backend
   */
  prepararPacienteParaBackend(paciente: PacienteData): PacienteData {
    return {
      documentType: paciente.tipoDocumento || paciente.documentType,
      documentNumber: paciente.numeroDocumento || paciente.documentNumber,
      firstNames: paciente.nombres || paciente.firstNames,
      lastNames: paciente.apellidos || paciente.lastNames,
      gender: paciente.sexo || paciente.gender,
      phone: paciente.telefono || paciente.phone,
      email: paciente.correo || paciente.email,
      address: {
        departmentId: paciente.departamento || paciente.address?.departmentId,
        provinceId: paciente.provincia || paciente.address?.provinceId,
        districtId: paciente.distrito || paciente.address?.districtId,
        line1: paciente.direccion || paciente.address?.line1
      }
    };
  }
}