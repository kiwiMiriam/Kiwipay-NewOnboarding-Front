import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUpload, faDownload, faTrashAlt, faCheck, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GuarantorDocumentService } from '../../../core/services/guarantor-document.service';
import { DocumentoService } from '../../../core/services/documento.service';
import { DocumentTableComponent } from '../documentTable/documentTable.component';
import { DocumentoData } from '@app/core/services/prospecto-api.service';
import { 
  DocumentType, 
  Document, 
  CreateDocumentRequest,
  DocumentStatus 
} from '../../../core/models/document.model';
import { 
  fileToBase64, 
  downloadFileFromBlob
} from '../../utils/file.utils';

@Component({
  selector: 'app-guarantor-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, DocumentTableComponent],
  template: `
    <div class="documentos-aval-section" *ngIf="hasGuarantor">
      <h2>Documentos del Aval</h2>
      
      <!-- Formulario de subida -->
      <div class="upload-form">
        <div class="form-row">
          <div class="form-group">
            <label>Tipo de Documento:</label>
            <select [(ngModel)]="selectedDocumentType">
              <option value="">Seleccionar tipo</option>
              <option *ngFor="let type of documentTypes" [value]="type.id">
                {{ type.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Archivo:</label>
            <input type="file" 
                   (change)="onFileSelected($event)" 
                   accept=".pdf,.jpg,.jpeg,.png"
                   #fileInput>
            <span *ngIf="selectedFile" class="file-name">{{ selectedFile.name }}</span>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group full-width">
            <label>Comentario:</label>
            <textarea [(ngModel)]="comment" 
                      placeholder="Agregar comentario (opcional)"
                      rows="3"></textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" 
                  (click)="uploadDocument()"
                  [disabled]="!selectedFile || !selectedDocumentType || isUploading">
            <fa-icon [icon]="faUpload"></fa-icon>
            {{ isUploading ? 'Subiendo...' : 'Subir Documento' }}
          </button>
        </div>
        
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Tabla de documentos usando DocumentTableComponent -->
      <app-document-table
        [documentos]="guarantorDocuments"
        [obtenerNombreTipoDocumento]="obtenerNombreTipoDocumento.bind(this)"
        (subir)="onSubirDocumento($event)"
        (descargar)="onDescargarDocumento($event)"
        (aprobar)="onAprobarDocumento($event)"
        (rechazar)="onRechazarDocumento($event)">
      </app-document-table>
    </div>
  `,
  styles: [`
    .documentos-aval-section {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .upload-form {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .form-group {
      flex: 1;
    }

    .form-group.full-width {
      width: 100%;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 5px;
      color: #333;
    }

    .form-group select,
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .file-name {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }

    .form-actions {
      text-align: right;
      margin-top: 15px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-top: 10px;
      padding: 10px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 15px;
      }
    }
  `]
})
export class GuarantorDocumentsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() clientId?: number;
  @Input() hasGuarantor: boolean = false;

  // Font Awesome icons
  faUpload = faUpload;
  faDownload = faDownload;
  faTrashAlt = faTrashAlt;
  faCheck = faCheck;
  faTimes = faTimes;
  faEye = faEye;

  // Component state
  documents: Document[] = [];
  guarantorDocuments: DocumentoData[] = [];
  documentTypes: DocumentType[] = [];
  selectedDocumentType = '';
  selectedFile: File | null = null;
  comment = '';
  errorMessage = '';
  isLoading = false;
  isUploading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private guarantorDocumentService: GuarantorDocumentService,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.loadDocumentTypes();
    if (this.clientId && this.hasGuarantor) {
      this.checkGuarantorAndLoadDocuments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId'] || changes['hasGuarantor']) {
      if (this.clientId && this.hasGuarantor) {
        this.checkGuarantorAndLoadDocuments();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDocumentTypes(): void {
    this.documentoService.getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.documentTypes = types;
        },
        error: (error: any) => {
          console.error('Error loading document types:', error);
        }
      });
  }

  private checkGuarantorAndLoadDocuments(): void {
    if (!this.clientId) return;

    this.guarantorDocumentService.checkGuarantorExists(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guarantor) => {
          if (guarantor) {
            this.loadGuarantorDocuments();
          }
        },
        error: (error: any) => {
          console.log('No guarantor found:', error);
        }
      });
  }

  private loadGuarantorDocuments(): void {
    if (!this.clientId) return;

    console.log('Cargando documentos del aval para cliente:', this.clientId);
    this.isLoading = true;
    this.guarantorDocumentService.getGuarantorDocuments(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          console.log('Documentos cargados desde el backend:', documents);
          this.documents = documents;
          // Convertir Document[] a DocumentoData[] para la tabla
          this.guarantorDocuments = documents.map(doc => {
            const mappedDoc = {
              id: doc.id,
              nombre: doc.filename,
              tipo: this.getDocumentTypeName(doc.documentTypeId),
              documentTypeId: doc.documentTypeId,
              fechaCarga: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
              fechaRevision: doc.reviewedAt ? new Date(doc.reviewedAt) : new Date(),
              comentario: doc.comment || '',
              estadoRevision: this.mapDocumentStatus(doc.reviewStatus),
              url: ''
            };
            console.log('Documento mapeado:', doc.id, 'reviewStatus:', doc.reviewStatus, '->', mappedDoc.estadoRevision);
            return mappedDoc;
          });
          console.log('Lista final de documentos para la tabla:', this.guarantorDocuments);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading guarantor documents:', error);
          this.errorMessage = 'Error al cargar los documentos del aval.';
          this.isLoading = false;
        }
      });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG, JPEG, PNG.';
        this.selectedFile = null;
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errorMessage = 'El archivo es demasiado grande. Máximo 10MB.';
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
      this.errorMessage = '';
    }
  }

  private mapDocumentStatus(status: string): string {
    console.log('Mapeando estado del documento:', status);
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'PENDING':
        return 'Pendiente';
      default:
        console.warn('Estado de documento desconocido:', status);
        return 'Pendiente';
    }
  }

  private getDocumentTypeName(documentTypeId: string): string {
    const type = this.documentTypes.find(t => t.id === documentTypeId);
    return type ? type.name : documentTypeId;
  }

  async uploadDocument(): Promise<void> {
    if (!this.clientId || !this.selectedFile || !this.selectedDocumentType) {
      this.errorMessage = 'Por favor, selecciona un tipo de documento y un archivo.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    try {
      const contentBase64 = await fileToBase64(this.selectedFile);

      const request: CreateDocumentRequest = {
        documentTypeId: this.selectedDocumentType,
        filename: this.selectedFile.name,
        mimeType: this.selectedFile.type,
        sizeBytes: this.selectedFile.size,
        comment: this.comment || undefined,
        contentBase64: contentBase64
      };

      this.guarantorDocumentService.createGuarantorDocument(this.clientId, request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (document) => {
            console.log('Documento creado exitosamente:', document);
            this.clearForm();
            this.loadGuarantorDocuments(); // Recargar la lista completa
            this.isUploading = false;
          },
          error: (error: any) => {
            console.error('Error uploading guarantor document:', error);
            this.errorMessage = 'Error al subir el documento del aval.';
            this.isUploading = false;
          }
        });
    } catch (error) {
      console.error('Error processing file:', error);
      this.errorMessage = 'Error al procesar el archivo.';
      this.isUploading = false;
    }
  }



  obtenerNombreTipoDocumento(tipoId: string | undefined): string {
    if (!tipoId) return 'Sin tipo';
    const type = this.documentTypes.find(t => t.id === tipoId);
    return type ? type.name : tipoId;
  }



  // Métodos para la integración con DocumentTableComponent
  onSubirDocumento(event: { documento: DocumentoData; archivo: File }): void {
    console.log('Subir documento del aval:', event);
    // Esta funcionalidad ya está manejada por el formulario de subida
  }

  onDescargarDocumento(documento: DocumentoData): void {
    if (!documento.id) {
      console.error('Document ID is required for download');
      return;
    }

    this.guarantorDocumentService.getGuarantorDocumentContent(documento.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          downloadFileFromBlob(blob, documento.nombre || 'documento');
        },
        error: (error: any) => {
          console.error('Error downloading document:', error);
          this.errorMessage = 'Error al descargar el documento.';
        }
      });
  }

  onAprobarDocumento(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for approval');
      return;
    }

    console.log('Aprobando documento:', event.documento.id);
    this.guarantorDocumentService.reviewGuarantorDocument(event.documento.id, 'APPROVED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Documento aprobado exitosamente');
          // Actualizar estado local inmediatamente
          const index = this.guarantorDocuments.findIndex(doc => doc.id === event.documento.id);
          if (index !== -1) {
            this.guarantorDocuments[index] = {
              ...this.guarantorDocuments[index],
              estadoRevision: 'Aprobado',
              fechaRevision: new Date()
            };
          }
          // También recargar desde el backend
          this.loadGuarantorDocuments();
        },
        error: (error: any) => {
          console.error('Error approving document:', error);
          this.errorMessage = 'Error al aprobar el documento.';
        }
      });
  }

  onRechazarDocumento(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for rejection');
      return;
    }

    console.log('Rechazando documento:', event.documento.id);
    this.guarantorDocumentService.reviewGuarantorDocument(event.documento.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Documento rechazado exitosamente');
          // Actualizar estado local inmediatamente
          const index = this.guarantorDocuments.findIndex(doc => doc.id === event.documento.id);
          if (index !== -1) {
            this.guarantorDocuments[index] = {
              ...this.guarantorDocuments[index],
              estadoRevision: 'Rechazado',
              fechaRevision: new Date()
            };
          }
          // También recargar desde el backend
          this.loadGuarantorDocuments();
        },
        error: (error: any) => {
          console.error('Error rejecting document:', error);
          this.errorMessage = 'Error al rechazar el documento.';
        }
      });
  }

  private clearForm(): void {
    this.selectedDocumentType = '';
    this.selectedFile = null;
    this.comment = '';
    this.errorMessage = '';
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
