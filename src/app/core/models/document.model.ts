/**
 * Representa un tipo de documento disponible en el sistema
 */
export interface DocumentType {
  id: string;
  nombre: string;
  descripcion?: string;
}

/**
 * Representa un documento del cliente
 */
export interface Document {
  id: string;
  documentTypeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  comment?: string;
  status: DocumentStatus;
  uploadedAt: string;
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
