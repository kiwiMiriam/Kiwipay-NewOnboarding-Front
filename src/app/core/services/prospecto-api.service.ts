import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '@src/environments/environment';
import { EndPoints } from '@src/config/end_points';

export interface ProspectoRiesgoData {
  id?: string;
  titular?: ClienteData;
  paciente?: PacienteData;
  avalista?: AvalistaData;
  documentos?: DocumentoData[];
  informacionProspecto?: InformacionProspecto;
}

export interface ClienteData {
  id?: number;
  documentType?: string;
  documentNumber?: string;
  firstNames?: string;
  lastNames?: string;
  maritalStatus?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: {
    departmentId?: string;
    provinceId?: string;
    districtId?: string;
    line1?: string;
  };
  createdAt?: string;
  // Campos adicionales para compatibilidad con el frontend
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  estadoCivil?: string;
  fechaNacimiento?: string;
  sexo?: string;
  correo?: string;
  telefono?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
}

export interface PacienteData {
  id?: number;
  clientId?: number;
  documentType?: string;
  documentNumber?: string;
  firstNames?: string;
  lastNames?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: {
    departmentId?: string;
    provinceId?: string;
    districtId?: string;
    line1?: string;
  };
  createdAt?: string;
  // Campos adicionales para compatibilidad con el frontend
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  sexo?: string;
  telefono?: string;
  correo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
}

export interface AvalistaData {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  estadoCivil: string;
  sexo: string;
  telefono: string;
  correo?: string;
  ingresos: number;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
}

export interface DocumentoData {
  id?: string;
  nombre: string;
  url?: string;
  fechaCarga: Date | string;
  fechaRevision?: Date | string;
  comentario?: string;
  estadoRevision?: string;
  tipo?: string;
}

export interface InformacionProspecto {
  informacionPersonal?: {
    nombres?: string;
    apellidos?: string;
    documento?: string;
    telefono?: string;
    correo?: string;
    fechaNacimiento?: string;
    edad?: string;
    ingresosMensuales?: string;
    scoreExperian?: number;
    grupo?: string;
    resultadoExperian?: string;
    calificacionExperian?: string;
    segmento?: string;
    respuestaExperian?: string;
  };
  informacionPrestamo?: {
    campana?: string;
    fechaSolicitud?: string;
    estadoPrestamo?: string;
    prestamoSolicitado?: string;
    numeroCuotas?: string;
    cuotaMensual?: string;
  };
  informacionMedica?: {
    centroMedico?: string;
    sucursal?: string;
    categoriaMedica?: string;
  };
}

export interface CreateProspectRiesgoRequest {
  titular: ClienteData;
  paciente?: PacienteData;
  avalista?: AvalistaData;
  documentos?: DocumentoData[];
}

@Injectable({
  providedIn: 'root'
})
export class ProspectoApiService {
  private readonly API_URL = environment.kiwiPayApi;
  private readonly BACKOFFICE_URL = environment.Back_Office_BaseUrl;

  constructor(private http: HttpClient) {}

  // Get prospecto riesgo data
  getProspectoRiesgoData(id?: string): Observable<ProspectoRiesgoData> {

    const options = id ? { params: { id } } : {};
    return this.http.get<any>(`${this.API_URL}${EndPoints.KIWIPAY.GET_PROSPECTO_RIESGO_DATA}`, options).pipe(
      map(response => {
        if (response.data) return response.data;
        return response;
      }),
      catchError(error => {
        console.error('Error fetching prospecto riesgo data:', error);
        return throwError(() => error);
      })
    );
  }

  // CRUD Client
  getClientById(id: number): Observable<ClienteData> {
    return this.http.get<ClienteData>(`http://localhost:8080/api/v1/clients/${id}`);
  }

  getAllClients(): Observable<ClienteData[]> {
    return this.http.get<ClienteData[]>(`http://localhost:8080/api/v1/clients`);
  }

  createClient(data: ClienteData): Observable<any> {
    return this.http.post(`http://localhost:8080/api/v1/clients`, data);
  }

  updateClient(id: number, data: ClienteData): Observable<any> {
    return this.http.put(`http://localhost:8080/api/v1/clients/${id}`, data);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`http://localhost:8080/api/v1/clients/${id}`);
  }

  // Obtener todos los pacientes de un cliente
  getPatients(clientId: number): Observable<PacienteData[]> {
    return this.http.get<PacienteData[]>(`http://localhost:8080/api/v1/clients/${clientId}/patients`).pipe(
      map(patients => patients.map(p => ({
        ...p,
        tipoDocumento: p.documentType,
        numeroDocumento: p.documentNumber,
        nombres: p.firstNames,
        apellidos: p.lastNames,
        sexo: p.gender,
        telefono: p.phone,
        correo: p.email,
        
        departamento: p.address?.departmentId,
        provincia: p.address?.provinceId,
        distrito: p.address?.districtId,
        direccion: p.address?.line1
      })))
    );
  }

  // Obtener un paciente específico
  getPatientById(clientId: number, patientId: number): Observable<PacienteData> {
    return this.http.get<PacienteData>(`http://localhost:8080/api/v1/clients/${clientId}/patients/${patientId}`).pipe(
      map(response => ({
        ...response,
        tipoDocumento: response.documentType,
        numeroDocumento: response.documentNumber,
        nombres: response.firstNames,
        apellidos: response.lastNames,
        sexo: response.gender,
        telefono: response.phone,
        correo: response.email,
        departamento: response.address?.departmentId,
        provincia: response.address?.provinceId,
        distrito: response.address?.districtId,
        direccion: response.address?.line1
      }))
    );
  }

  // Crear paciente
  createPatient(clientId: number, data: PacienteData): Observable<PacienteData> {
    const requestData = {
      documentType: data.tipoDocumento || data.documentType,
      documentNumber: data.numeroDocumento || data.documentNumber,
      firstNames: data.nombres || data.firstNames,
      lastNames: data.apellidos || data.lastNames,
      gender: data.sexo || data.gender,
      phone: data.telefono || data.phone,
      email: data.correo || data.email,
      address: {
        departmentId: data.departamento || data.address?.departmentId,
        provinceId: data.provincia || data.address?.provinceId,
        districtId: data.distrito || data.address?.districtId,
        line1: data.direccion || data.address?.line1
      }
    };
    
    return this.http.post<PacienteData>(`http://localhost:8080/api/v1/clients/${clientId}/patients`, requestData).pipe(
      map(response => ({
        ...response,
        tipoDocumento: response.documentType,
        numeroDocumento: response.documentNumber,
        nombres: response.firstNames,
        apellidos: response.lastNames,
        sexo: response.gender,
        telefono: response.phone,
        correo: response.email,
        departamento: response.address?.departmentId,
        provincia: response.address?.provinceId,
        distrito: response.address?.districtId,
        direccion: response.address?.line1
      }))
    );
  }

  // Editar paciente
  updatePatient(clientId: number, patientId: number, data: PacienteData): Observable<PacienteData> {
    const requestData = {
      documentType: data.tipoDocumento || data.documentType,
      documentNumber: data.numeroDocumento || data.documentNumber,
      firstNames: data.nombres || data.firstNames,
      lastNames: data.apellidos || data.lastNames,
      gender: data.sexo || data.gender,
      phone: data.telefono || data.phone,
      email: data.correo || data.email,
      address: {
        departmentId: data.departamento || data.address?.departmentId,
        provinceId: data.provincia || data.address?.provinceId,
        districtId: data.distrito || data.address?.districtId,
        line1: data.direccion || data.address?.line1
      }
    };

    console.log('[UPDATE PATIENT] Request:', {
      clientId,
      patientId,
      documentNumber: requestData.documentNumber,
      gender: requestData.gender,
      fullRequest: requestData
    });
    
    return this.http.put<PacienteData>(`http://localhost:8080/api/v1/clients/${clientId}/patients/${patientId}`, requestData).pipe(
      map(response => {
        console.log('[UPDATE PATIENT] Response received:', {
          gender: response.gender,
          fullResponse: response
        });
        const normalized = {
          ...response,
          tipoDocumento: response.documentType,
          numeroDocumento: response.documentNumber,
          nombres: response.firstNames,
          apellidos: response.lastNames,
          sexo: response.gender,
          telefono: response.phone,
          correo: response.email,
          departamento: response.address?.departmentId,
          provincia: response.address?.provinceId,
          distrito: response.address?.districtId,
          direccion: response.address?.line1
        };
        console.log('[UPDATE PATIENT] Normalized:', {
          sexo: normalized.sexo,
          fullNormalized: normalized
        });
        return normalized;
      })
    );
  }

  // Eliminar paciente
  deletePatient(clientId: number, patientId: number): Observable<any> {
    return this.http.delete(`http://localhost:8080/api/v1/clients/${clientId}/patients/${patientId}`);
  }

  // Create/Update Avalista
  createAvalista(data: AvalistaData): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }*/

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_AVALISTA}`, data).pipe(
      catchError(error => {
        console.error('Error creating avalista:', error);
        return throwError(() => error);
      })
    );
  }

  updateAvalista(data: AvalistaData & { id?: string }): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }*/

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_AVALISTA}`, data).pipe(
      catchError(error => {
        console.error('Error updating avalista:', error);
        return throwError(() => error);
      })
    );
  }

  // Create/Update Documentos
  createDocumentos(data: DocumentoData[]): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, documentos: data }).pipe(delay(500));
    }*/

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_DOCUMENTOS}`, { documentos: data }).pipe(
      catchError(error => {
        console.error('Error creating documentos:', error);
        return throwError(() => error);
      })
    );
  }

  updateDocumentos(data: DocumentoData[]): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, documentos: data }).pipe(delay(500));
    }*/

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_DOCUMENTOS}`, { documentos: data }).pipe(
      catchError(error => {
        console.error('Error updating documentos:', error);
        return throwError(() => error);
      })
    );
  }

  // Update Prospecto Riesgo
  updateProspectoRiesgo(data: ProspectoRiesgoData): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }*/

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_PROSPECTO_RIESGO}`, data).pipe(
      catchError(error => {
        console.error('Error updating prospecto riesgo:', error);
        return throwError(() => error);
      })
    );
  }

  // Create Prospect Riesgo (Aprobación manual)
  createProspectRiesgo(data: CreateProspectRiesgoRequest): Observable<any> {
    /*if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }*/

    return this.http.post(`${this.BACKOFFICE_URL}${EndPoints.BACKOFFICE.POST_CREATE_PROSPECT_RIESGO}`, data, {
      headers: {
        'X-API-Key': environment.Back_Office_ApiKey
      }
    }).pipe(
      catchError(error => {
        console.error('Error creating prospect riesgo:', error);
        return throwError(() => error);
      })
    );
  }

  
}

