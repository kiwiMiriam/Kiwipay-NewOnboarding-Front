import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUpload, faDownload, faTrashAlt, faCheck, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GuarantorDocumentService } from '../../../core/services/guarantor-document.service';
import { DocumentoService } from '../../../core/services/documento.service';
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
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="documentos-aval-section" *ngIf="hasGuarantor">      
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

      <!-- Tabla de documentos -->
      <div class="documents-table">
        <div class="table-header">
          <div class="col-tipo">Tipo</div>
          <div class="col-archivo">Archivo</div>
          <div class="col-comentario">Comentario</div>
          <div class="col-estado">Estado</div>
          <div class="col-acciones">Acciones</div>
        </div>
        
        <div *ngIf="isLoading" class="loading-row">
          <div class="loading-content">Cargando documentos...</div>
        </div>
        
        <div *ngIf="!isLoading && documents.length === 0" class="empty-row">
          <div class="empty-content">No hay documentos del aval cargados</div>
        </div>
        
        <div *ngFor="let document of documents; trackBy: trackByDocumentId" class="table-row">
          <div class="col-tipo">
            {{ obtenerNombreTipoDocumento(document.documentTypeId) }}
          </div>
          
          <div class="col-archivo">
            <div class="file-info">
              <span class="file-name">{{ document.filename }}</span>
              <span class="file-size">{{ formatFileSize(document.sizeBytes) }}</span>
            </div>
          </div>
          
          <div class="col-comentario">
            {{ document.comment || '-' }}
          </div>
          
          <div class="col-estado">
            <span [class]="getStatusClass(document.status)">
              {{ getStatusText(document.status) }}
            </span>
          </div>
          
          <div class="col-acciones">
            <button class="btn-action btn-download" 
                    (click)="downloadDocument(document)"
                    title="Descargar">
              <fa-icon [icon]="faDownload"></fa-icon>
            </button>
            
            <button class="btn-action btn-delete" 
                    (click)="deleteDocument(document)"
                    title="Eliminar">
              <fa-icon [icon]="faTrashAlt"></fa-icon>
            </button>
            
            <button class="btn-action btn-approve" 
                    (click)="approveDocument(document)"
                    *ngIf="document.status !== 'APPROVED'"
                    title="Aprobar">
              <fa-icon [icon]="faCheck"></fa-icon>
            </button>
            
            <button class="btn-action btn-reject" 
                    (click)="rejectDocument(document)"
                    *ngIf="document.status !== 'REJECTED'"
                    title="Rechazar">
              <fa-icon [icon]="faTimes"></fa-icon>
            </button>
          </div>
        </div>
      </div>
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

    .documents-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .table-header {
      display: flex;
      background-color: #f1f3f4;
      font-weight: 600;
      padding: 15px;
      border-bottom: 2px solid #dee2e6;
    }

    .table-row {
      display: flex;
      padding: 15px;
      border-bottom: 1px solid #dee2e6;
      transition: background-color 0.2s;
    }

    .table-row:hover {
      background-color: #f8f9fa;
    }

    .col-tipo { flex: 2; }
    .col-archivo { flex: 3; }
    .col-comentario { flex: 2; }
    .col-estado { flex: 1; text-align: center; }
    .col-acciones { flex: 2; text-align: center; }

    .file-info {
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 500;
      color: #333;
    }

    .file-size {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .status-approved {
      color: #28a745;
      font-weight: 500;
    }

    .status-rejected {
      color: #dc3545;
      font-weight: 500;
    }

    .status-pending {
      color: #ffc107;
      font-weight: 500;
    }

    .btn-action {
      background: none;
      border: none;
      padding: 5px;
      margin: 0 2px;
      cursor: pointer;
      color: #6c757d;
      border-radius: 3px;
      transition: all 0.2s;
    }

    .btn-action:hover {
      background-color: #f8f9fa;
    }

    .btn-download:hover { color: #007bff; }
    .btn-delete:hover { color: #dc3545; }
    .btn-approve:hover { color: #28a745; }
    .btn-reject:hover { color: #ffc107; }

    .loading-row, .empty-row {
      padding: 40px 20px;
      text-align: center;
      color: #666;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 15px;
      }
      
      .table-header {
        display: none;
      }
      
      .table-row {
        flex-direction: column;
        gap: 10px;
      }
      
      .table-row > div:before {
        content: attr(data-label) ': ';
        font-weight: 600;
        color: #333;
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

    this.isLoading = true;
    this.guarantorDocumentService.getGuarantorDocuments(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
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
            this.documents.push(document);
            this.clearForm();
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

  downloadDocument(document: Document): void {
    this.guarantorDocumentService.getGuarantorDocumentContent(document.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          downloadFileFromBlob(blob, document.filename);
        },
        error: (error: any) => {
          console.error('Error downloading document:', error);
          this.errorMessage = 'Error al descargar el documento.';
        }
      });
  }

  deleteDocument(document: Document): void {
    if (!this.clientId) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este documento del aval?')) {
      this.guarantorDocumentService.deleteGuarantorDocument(this.clientId, document.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.documents = this.documents.filter(doc => doc.id !== document.id);
          },
          error: (error: any) => {
            console.error('Error deleting document:', error);
            this.errorMessage = 'Error al eliminar el documento.';
          }
        });
    }
  }

  approveDocument(document: Document): void {
    if (confirm('¿Estás seguro de que deseas aprobar este documento?')) {
      this.guarantorDocumentService.reviewGuarantorDocument(document.id, 'APPROVED')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const index = this.documents.findIndex(doc => doc.id === document.id);
            if (index >= 0) {
              this.documents[index] = { ...this.documents[index], status: DocumentStatus.APPROVED };
            }
          },
          error: (error: any) => {
            console.error('Error approving document:', error);
            this.errorMessage = 'Error al aprobar el documento.';
          }
        });
    }
  }

  rejectDocument(document: Document): void {
    if (confirm('¿Estás seguro de que deseas rechazar este documento?')) {
      this.guarantorDocumentService.reviewGuarantorDocument(document.id, 'REJECTED')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const index = this.documents.findIndex(doc => doc.id === document.id);
            if (index >= 0) {
              this.documents[index] = { ...this.documents[index], status: DocumentStatus.REJECTED };
            }
          },
          error: (error: any) => {
            console.error('Error rejecting document:', error);
            this.errorMessage = 'Error al rechazar el documento.';
          }
        });
    }
  }

  obtenerNombreTipoDocumento(typeId: string): string {
    const type = this.documentTypes.find(t => t.id === typeId);
    return type ? type.name : typeId;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'status-approved';
      case DocumentStatus.REJECTED:
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'Aprobado';
      case DocumentStatus.REJECTED:
        return 'Rechazado';
      case DocumentStatus.PENDING:
        return 'Pendiente';
      default:
        return 'Pendiente';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  trackByDocumentId(index: number, document: Document): string {
    return document.id;
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
