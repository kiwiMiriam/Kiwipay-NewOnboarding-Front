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
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  estadoCivil: string;
  fechaNacimiento: string;
  sexo: string;
  correo: string;
  telefono: string;
  telefono2?: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  tasaExperian?: number;
  nuevaTasa?: number;
  tasaAdicional?: number;
  tasaFinal?: number;
}

export interface PacienteData {
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
  private readonly USE_MOCK = environment.useMockApi;

  constructor(private http: HttpClient) {}

  // Get prospecto riesgo data
  getProspectoRiesgoData(id?: string): Observable<ProspectoRiesgoData> {
    if (this.USE_MOCK) {
      return this.mockGetProspectoRiesgoData(id).pipe(delay(500));
    }

    const options = id ? { params: { id } } : {};
    return this.http.get<any>(`${this.API_URL}${EndPoints.KIWIPAY.GET_PROSPECTO_RIESGO_DATA}`, options).pipe(
      map(response => {
        if (response.data) return response.data;
        return response;
      }),
      catchError(error => {
        console.error('Error fetching prospecto riesgo data:', error);
        // Fallback to mock on error
        return this.mockGetProspectoRiesgoData(id);
      })
    );
  }

  // Create/Update Client
  createClient(data: ClienteData): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_CLIENT}`, data).pipe(
      catchError(error => {
        console.error('Error creating client:', error);
        return throwError(() => error);
      })
    );
  }

  updateClient(data: ClienteData & { id?: string }): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_CLIENT}`, data).pipe(
      catchError(error => {
        console.error('Error updating client:', error);
        return throwError(() => error);
      })
    );
  }

  // Create/Update Patient
  createPatient(data: PacienteData): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_PATIENT}`, data).pipe(
      catchError(error => {
        console.error('Error creating patient:', error);
        return throwError(() => error);
      })
    );
  }

  updatePatient(data: PacienteData & { id?: string }): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_PATIENT}`, data).pipe(
      catchError(error => {
        console.error('Error updating patient:', error);
        return throwError(() => error);
      })
    );
  }

  // Create/Update Avalista
  createAvalista(data: AvalistaData): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_AVALISTA}`, data).pipe(
      catchError(error => {
        console.error('Error creating avalista:', error);
        return throwError(() => error);
      })
    );
  }

  updateAvalista(data: AvalistaData & { id?: string }): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_AVALISTA}`, data).pipe(
      catchError(error => {
        console.error('Error updating avalista:', error);
        return throwError(() => error);
      })
    );
  }

  // Create/Update Documentos
  createDocumentos(data: DocumentoData[]): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, documentos: data }).pipe(delay(500));
    }

    return this.http.post(`${this.API_URL}${EndPoints.KIWIPAY.POST_CREATE_DOCUMENTOS}`, { documentos: data }).pipe(
      catchError(error => {
        console.error('Error creating documentos:', error);
        return throwError(() => error);
      })
    );
  }

  updateDocumentos(data: DocumentoData[]): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, documentos: data }).pipe(delay(500));
    }

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_DOCUMENTOS}`, { documentos: data }).pipe(
      catchError(error => {
        console.error('Error updating documentos:', error);
        return throwError(() => error);
      })
    );
  }

  // Update Prospecto Riesgo
  updateProspectoRiesgo(data: ProspectoRiesgoData): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, ...data }).pipe(delay(500));
    }

    return this.http.put(`${this.API_URL}${EndPoints.KIWIPAY.PUT_UPDATE_PROSPECTO_RIESGO}`, data).pipe(
      catchError(error => {
        console.error('Error updating prospecto riesgo:', error);
        return throwError(() => error);
      })
    );
  }

  // Create Prospect Riesgo (Aprobación manual)
  createProspectRiesgo(data: CreateProspectRiesgoRequest): Observable<any> {
    if (this.USE_MOCK) {
      return of({ success: true, id: '1', ...data }).pipe(delay(500));
    }

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

  // Mock data for testing
  private mockGetProspectoRiesgoData(id?: string): Observable<ProspectoRiesgoData> {
    const mockData: ProspectoRiesgoData = {
      id: id || '1',
      titular: {
        tipoDocumento: 'DNI',
        numeroDocumento: '004297536',
        nombres: 'SUHAIL ADRIANA',
        apellidos: 'ALDREY TABAREZ',
        estadoCivil: 'SOLTERO',
        fechaNacimiento: '1974-06-29',
        sexo: 'F',
        correo: 'suhailaldrey216@gmail.com',
        telefono: '+51917950100',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores',
        direccion: 'Av. Principal 123',
        tasaExperian: 15.5,
        nuevaTasa: 18.0,
        tasaAdicional: 2.0,
        tasaFinal: 20.0
      },
      paciente: {
        tipoDocumento: 'DNI',
        numeroDocumento: '12345678',
        nombres: 'Juan',
        apellidos: 'Pérez',
        sexo: 'M',
        telefono: '999888777',
        correo: 'juan@example.com',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'San Isidro',
        direccion: 'Av. Ejemplo 456'
      },
      avalista: {
        tipoDocumento: 'DNI',
        numeroDocumento: '87654321',
        nombres: 'María',
        apellidos: 'García',
        estadoCivil: 'CASADO',
        sexo: 'F',
        telefono: '999777666',
        correo: 'maria@example.com',
        ingresos: 5000,
        departamento: 'Arequipa',
        provincia: 'Arequipa',
        distrito: 'Yanahuara',
        direccion: 'Calle Ejemplo 789'
      },
      documentos: [
        {
          id: '1',
          nombre: 'Contrato.pdf',
          fechaCarga: new Date('2025-10-10'),
          fechaRevision: new Date('2025-10-12'),
          comentario: 'Pendiente de aprobación',
          estadoRevision: 'Pendiente',
          tipo: 'Contrato'
        },
        {
          id: '2',
          nombre: 'Factura_123.pdf',
          fechaCarga: new Date('2025-10-15'),
          fechaRevision: new Date('2025-10-16'),
          comentario: 'Aprobado',
          estadoRevision: 'Aprobado',
          tipo: 'Factura'
        }
      ],
      informacionProspecto: {
        informacionPersonal: {
          nombres: 'SUHAIL ADRIANA',
          apellidos: 'ALDREY TABAREZ',
          documento: '004297536',
          telefono: '+51 917950100',
          correo: 'suhailaldrey216@gmail.com',
          fechaNacimiento: '1974-06-29',
          edad: '51 años',
          ingresosMensuales: 'S/ 3,000.00',
          scoreExperian: 0,
          grupo: '',
          resultadoExperian: '',
          calificacionExperian: 'Tabla de peor calificación experian',
          segmento: '',
          respuestaExperian: ''
        },
        informacionPrestamo: {
          campana: 'Sin campaña',
          fechaSolicitud: '2025-10-20',
          estadoPrestamo: 'Crédito con QR Redimido',
          prestamoSolicitado: 'S/ 15,000.00',
          numeroCuotas: '12',
          cuotaMensual: 'S/ 580.00'
        },
        informacionMedica: {
          centroMedico: 'dr. luis coa',
          sucursal: 'san clemente',
          categoriaMedica: 'cirugía plástica y reconstructiva'
        }
      }
    };

    return of(mockData);
  }
}

