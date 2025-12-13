/**
 * Representa un tipo de documento disponible en el sistema
 */
export interface DocumentType {
  id: string;
  name: string;
  descripcion?: string;
}

/**
 * Representa un documento del cliente
 */
export interface Document {
  id: string;
  clientId?: number;
  documentTypeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  comment?: string;
  reviewStatus: string; // Campo correcto del backend
  uploadedAt: string;
  reviewedAt?: string; // Fecha de revisión del backend
  uploadedBy?: string;
}

/**
 * Estados posibles de un documento
 */
export enum DocumentStatus {
  READY = 'READY',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

/**
 * Request para crear un documento
 */
export interface CreateDocumentRequest {
  documentTypeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  comment?: string;
  contentBase64: string;
}

/**
 * Response del contenido de un documento
 */
export interface DocumentContentResponse {
  contentBase64: string;
  filename: string;
  mimeType: string;
}
