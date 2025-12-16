import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '@src/environments/environment';
import { EndPoints } from '@src/config/end_points';

export interface ProspectoRiesgoData {
  id?: number | string;
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
  // Campos de información adicional (futuros en el backend)
  experianRating?: string;
  calificacionExperian?: string;
  age?: number | string;
  edad?: number | string;
  birthDate?: string;
  fechaNacimiento?: string;
  group?: string;
  grupo?: string;
  monthlyIncome?: number | string;
  ingresosMensuales?: number | string;
  experianResponse?: string;
  respuestaExperian?: string;
  experianResult?: string;
  resultadoExperian?: string;
  experianScore?: number | string;
  scoreExperian?: number | string;
  segment?: string;
  segmento?: string;
}

export interface ConyugeData {
  id?: number;
  clientId?: number;
  documentType?: string;
  documentNumber?: string;
  firstNames?: string;
  lastNames?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  // Campos adicionales para compatibilidad con el frontend
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
}

export interface MedicalCategory {
  id: string;
  name: string;
}

export interface Clinic {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface ClinicalData {
  medicalCategoryId?: string;
  clinicId?: string;
  branchId?: string;
  // Campos para compatibilidad con el frontend
  categoriaMedica?: string;
  clinica?: string;
  sede?: string;
}

export interface QuoteData {
  id?: number;
  documentType: string;
  documentNumber: string;
  monthlyIncome: number;
  branchId: string;
  clientId?: number;
}

export interface AvalistaData {
  id?: number | string;
  guarantorId?: string;
  clientId?: number;
  documentType?: string;
  documentNumber?: string;
  monthlyIncome?: number;
  firstNames?: string;
  lastNames?: string;
  gender?: string;
  maritalStatus?: string;
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
  ingresos?: number;
  nombres?: string;
  apellidos?: string;
  estadoCivil?: string;
  sexo?: string;
  telefono?: string;
  correo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
}

export interface DocumentoData {
  id: string;
  nombre: string;
  url: string;
  fechaCarga: Date | string;
  fechaRevision: Date | string;
  comentario?: string;
  estadoRevision: string;
  tipo: string;
  documentTypeId: string;
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
  getProspectoRiesgoData(id: number): Observable<ClienteData> {
    return this.http.get<ClienteData>(`http://localhost:8080/api/v1/clients/${id}`);
  }
  updateProspectoRiesgoData(id: number, data: ProspectoRiesgoData): Observable<ProspectoRiesgoData> {
    return this.http.put<ProspectoRiesgoData>(`http://localhost:8080/api/v1/clients/${id}`, data);
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

  // ========== GUARANTOR (AVAL) OPERATIONS ==========
  
  // Obtener aval de un cliente
  getGuarantor(clientId: number): Observable<AvalistaData | null> {
    return this.http.get<any>(`http://localhost:8080/api/v1/clients/${clientId}/guarantor`).pipe(
      map((data) => {
        if (!data) return null;
        return {
          id: data.guarantorId,
          guarantorId: data.guarantorId,
          clientId: data.clientId,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          monthlyIncome: data.monthlyIncome,
          firstNames: data.firstNames,
          lastNames: data.lastNames,
          gender: data.gender,
          maritalStatus: data.maritalStatus,
          email: data.email,
          phone: data.phone,
          address: data.address,
          createdAt: data.createdAt
        };
      }),
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      })
    );
  }

  // Crear o actualizar aval (PUT)
  updateGuarantor(clientId: number, data: AvalistaData): Observable<AvalistaData> {
    const requestBody = {
      documentType: data.documentType || data.tipoDocumento,
      documentNumber: data.documentNumber || data.numeroDocumento,
      monthlyIncome: data.monthlyIncome || data.ingresos,
      firstNames: data.firstNames || data.nombres,
      lastNames: data.lastNames || data.apellidos,
      gender: data.gender || data.sexo,
      maritalStatus: data.maritalStatus || data.estadoCivil,
      email: data.email || data.correo,
      phone: data.phone || data.telefono,
      address: {
        departmentId: data.address?.departmentId || data.departamento,
        provinceId: data.address?.provinceId || data.provincia,
        districtId: data.address?.districtId || data.distrito,
        line1: data.address?.line1 || data.direccion
      }
    };

    console.log('=== UPDATING GUARANTOR ===');
    console.log('Client ID:', clientId);
    console.log('Request Body:', requestBody);

    return this.http.put<any>(`http://localhost:8080/api/v1/clients/${clientId}/guarantor`, requestBody).pipe(
      map((response) => {
        console.log('Guarantor update response:', response);
        return {
          id: response.guarantorId,
          guarantorId: response.guarantorId,
          clientId: response.clientId,
          documentType: response.documentType,
          documentNumber: response.documentNumber,
          monthlyIncome: response.monthlyIncome,
          firstNames: response.firstNames,
          lastNames: response.lastNames,
          gender: response.gender,
          maritalStatus: response.maritalStatus,
          email: response.email,
          phone: response.phone,
          address: response.address,
          createdAt: response.createdAt
        };
      })
    );
  }

  // ========== SPOUSE (CÓNYUGE) OPERATIONS ==========
  
  // Obtener cónyuge de un cliente
  getSpouse(clientId: number): Observable<ConyugeData | null> {
    return this.http.get<ConyugeData>(`http://localhost:8080/api/v1/clients/${clientId}/spouse`).pipe(
      map(response => ({
        ...response,
        tipoDocumento: response.documentType,
        numeroDocumento: response.documentNumber,
        nombres: response.firstNames,
        apellidos: response.lastNames,
        correo: response.email,
        telefono: response.phone
      })),
      catchError(error => {
        // Si no existe cónyuge (404), retornar null
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  // Crear cónyuge
  createSpouse(clientId: number, data: ConyugeData): Observable<ConyugeData> {
    const requestData = {
      documentType: data.tipoDocumento || data.documentType,
      documentNumber: data.numeroDocumento || data.documentNumber,
      firstNames: data.nombres || data.firstNames,
      lastNames: data.apellidos || data.lastNames,
      email: data.correo || data.email,
      phone: data.telefono || data.phone
    };
    
    console.log('[CREATE SPOUSE] ClientId:', clientId, 'Request:', requestData);
    
    return this.http.post<ConyugeData>(`http://localhost:8080/api/v1/clients/${clientId}/spouse`, requestData).pipe(
      map(response => {
        console.log('[CREATE SPOUSE] Response:', response);
        return {
          ...response,
          tipoDocumento: response.documentType,
          numeroDocumento: response.documentNumber,
          nombres: response.firstNames,
          apellidos: response.lastNames,
          correo: response.email,
          telefono: response.phone
        };
      })
    );
  }

  // Actualizar cónyuge
  updateSpouse(clientId: number, data: ConyugeData): Observable<ConyugeData> {
    const requestData = {
      documentType: data.tipoDocumento || data.documentType,
      documentNumber: data.numeroDocumento || data.documentNumber,
      firstNames: data.nombres || data.firstNames,
      lastNames: data.apellidos || data.lastNames,
      email: data.correo || data.email,
      phone: data.telefono || data.phone
    };

    console.log('[UPDATE SPOUSE] ClientId:', clientId, 'Request:', requestData);
    
    return this.http.put<ConyugeData>(`http://localhost:8080/api/v1/clients/${clientId}/spouse`, requestData).pipe(
      map(response => {
        console.log('[UPDATE SPOUSE] Response:', response);
        return {
          ...response,
          tipoDocumento: response.documentType,
          numeroDocumento: response.documentNumber,
          nombres: response.firstNames,
          apellidos: response.lastNames,
          correo: response.email,
          telefono: response.phone
        };
      })
    );
  }

  // ========== CLINICAL DATA OPERATIONS ==========
  
  // Obtener categorías médicas
  getMedicalCategories(): Observable<MedicalCategory[]> {
    return this.http.get<MedicalCategory[]>('http://localhost:8080/api/v1/medical-categories');
  }

  // Obtener clínicas por categoría médica
  getClinicsByCategory(categoryId: string): Observable<Clinic[]> {
    return this.http.get<Clinic[]>('http://localhost:8080/api/v1/clinics', {
      params: { categoryId }
    });
  }

  // Obtener sedes por clínica
  getBranchesByClinic(clinicId: string): Observable<Branch[]> {
    return this.http.get<Branch[]>(`http://localhost:8080/api/v1/clinics/${clinicId}/branches`);
  }

  // Obtener datos clínicos de un cliente
  getClinicalData(clientId: number): Observable<ClinicalData | null> {
    return this.http.get<ClinicalData>(`http://localhost:8080/api/v1/clients/${clientId}/clinical-data`).pipe(
      map(response => ({
        ...response,
        categoriaMedica: response.medicalCategoryId,
        clinica: response.clinicId,
        sede: response.branchId
      })),
      catchError(error => {
        // Si no existe datos clínicos (404), retornar null
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  // Crear datos clínicos
  createClinicalData(clientId: number, data: ClinicalData): Observable<ClinicalData> {
    const requestData = {
      medicalCategoryId: data.categoriaMedica || data.medicalCategoryId,
      clinicId: data.clinica || data.clinicId,
      branchId: data.sede || data.branchId
    };

    console.log('[CREATE CLINICAL DATA] ClientId:', clientId, 'Request:', requestData);

    return this.http.post<ClinicalData>(`http://localhost:8080/api/v1/clients/${clientId}/clinical-data`, requestData).pipe(
      map(response => {
        console.log('[CREATE CLINICAL DATA] Response:', response);
        return {
          ...response,
          categoriaMedica: response.medicalCategoryId,
          clinica: response.clinicId,
          sede: response.branchId
        };
      })
    );
  }

  // Actualizar datos clínicos
  updateClinicalData(clientId: number, data: ClinicalData): Observable<ClinicalData> {
    const requestData = {
      medicalCategoryId: data.categoriaMedica || data.medicalCategoryId,
      clinicId: data.clinica || data.clinicId,
      branchId: data.sede || data.branchId
    };

    console.log('[UPDATE CLINICAL DATA] ClientId:', clientId, 'Request:', requestData);

    return this.http.put<ClinicalData>(`http://localhost:8080/api/v1/clients/${clientId}/clinical-data`, requestData).pipe(
      map(response => {
        console.log('[UPDATE CLINICAL DATA] Response:', response);
        return {
          ...response,
          categoriaMedica: response.medicalCategoryId,
          clinica: response.clinicId,
          sede: response.branchId
        };
      })
    );
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

  // ========== DOCUMENT OPERATIONS ==========
  
  // Obtener documentos NO riesgo del cliente
  getNonRiskDocuments(clientId: number): Observable<DocumentoData[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/v1/clients/${clientId}/documents/non-risk`).pipe(
      map((docs) => docs.map((doc) => ({
        id: doc.id?.toString() || '',
        nombre: doc.name || doc.filename || '',
        url: doc.url || '',
        fechaCarga: doc.createdAt || new Date().toISOString(),
        fechaRevision: doc.reviewedAt || undefined,
        comentario: doc.comment || '',
        estadoRevision: doc.reviewStatus || 'Pendiente',
        tipo: doc.type || '',
        documentTypeId: doc.documentTypeId || ''
      })))
    );
  }

  // Obtener documentos de riesgo del cliente
  getRiskDocuments(clientId: number): Observable<DocumentoData[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/v1/clients/${clientId}/documents/risk`).pipe(
      map((docs) => docs.map((doc) => ({
        id: doc.id?.toString() || '',
        nombre: doc.name || doc.filename || '',
        url: doc.url || '',
        fechaCarga: doc.createdAt || new Date().toISOString(),
        fechaRevision: doc.reviewedAt || undefined,
        comentario: doc.comment || '',
        estadoRevision: doc.reviewStatus || 'Pendiente',
        tipo: doc.type || '',
        documentTypeId: doc.documentTypeId || ''
      })))
    );
  }

  // Obtener contenido del documento (base64)
  getDocumentContent(documentId: string): Observable<string> {
    return this.http.get(`http://localhost:8080/api/v1/documents/${documentId}/content`, {
      responseType: 'text'
    });
  }

  // Aprobar o rechazar documento
  reviewDocument(documentId: string, reviewStatus: 'APPROVED' | 'REJECTED'): Observable<any> {
    return this.http.patch(`http://localhost:8080/api/v1/documents/${documentId}/review`, {
      reviewStatus
    });
  }

  // ========== DEPRECATED METHODS (for backwards compatibility) ==========

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

  // ============================================
  // QUOTES ENDPOINTS
  // ============================================

  /**
   * Obtener todas las cotizaciones de un cliente
   */
  getQuotesByClientId(clientId: number): Observable<QuoteData[]> {
    return this.http.get<QuoteData[]>(`${this.API_URL}/clients/${clientId}/quotes`).pipe(
      catchError(error => {
        console.error('[GET QUOTES] Error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear una nueva cotización para un cliente
   */
  createQuote(clientId: number, quoteData: Omit<QuoteData, 'id' | 'clientId'>): Observable<QuoteData> {
    return this.http.post<QuoteData>(`${this.API_URL}/clients/${clientId}/quotes`, quoteData).pipe(
      catchError(error => {
        console.error('[CREATE QUOTE] Error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar una cotización existente
   */
  updateQuote(quoteId: number, quoteData: Omit<QuoteData, 'id' | 'clientId'>): Observable<QuoteData> {
    return this.http.put<QuoteData>(`${this.API_URL}/quotes/${quoteId}`, quoteData).pipe(
      catchError(error => {
        console.error('[UPDATE QUOTE] Error:', error);
        return throwError(() => error);
      })
    );
  }

  
}


