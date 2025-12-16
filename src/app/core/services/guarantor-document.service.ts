import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { 
  DocumentType, 
  Document, 
  CreateDocumentRequest, 
  DocumentContentResponse 
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class GuarantorDocumentService {
  private baseUrl = `${environment.kiwiPayApi}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Verificar si existe un aval para el cliente
   */
  checkGuarantorExists(clientId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/clients/${clientId}/guarantor`);
  }

  /**
   * Obtener todos los documentos del aval de un cliente
   */
  getGuarantorDocuments(clientId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/clients/${clientId}/guarantor/documents`);
  }

  /**
   * Crear un nuevo documento para el aval de un cliente
   */
  createGuarantorDocument(clientId: number, request: CreateDocumentRequest): Observable<Document> {
    return this.http.post<Document>(`${this.baseUrl}/clients/${clientId}/guarantor/documents`, request);
  }

  /**
   * Obtener el contenido de un documento del aval como Blob (binario)
   */
  getGuarantorDocumentContent(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/guarantor-documents/${documentId}/content`, {
      responseType: 'blob'
    });
  }

  /**
   * Eliminar un documento del aval
   */
  deleteGuarantorDocument(clientId: number, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clients/${clientId}/guarantor/documents/${documentId}`);
  }

  /**
   * Aprobar o rechazar un documento del aval
   */
  reviewGuarantorDocument(documentId: string, data: { reviewStatus: 'APPROVED' | 'REJECTED' | 'PENDING'; comment?: string }): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/guarantor-documents/${documentId}/review`, data);
  }
}