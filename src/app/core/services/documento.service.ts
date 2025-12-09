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
export class DocumentoService {
  private baseUrl = `${environment.kiwiPayApi}/api/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los tipos de documentos disponibles
   */
  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(`${this.baseUrl}/document-types`);
  }

  /**
   * Obtener todos los documentos de un cliente
   */
  getClientDocuments(clientId: number): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.baseUrl}/clients/${clientId}/documents`);
  }

  /**
   * Crear un nuevo documento para un cliente
   */
  createDocument(clientId: number, request: CreateDocumentRequest): Observable<Document> {
    return this.http.post<Document>(`${this.baseUrl}/clients/${clientId}/documents`, request);
  }

  /**
   * Obtener el contenido de un documento como Blob (binario)
   */
  getDocumentContent(documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${documentId}/content`, {
      responseType: 'blob'
    });
  }

  /**
   * Eliminar un documento
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`);
  }
}


