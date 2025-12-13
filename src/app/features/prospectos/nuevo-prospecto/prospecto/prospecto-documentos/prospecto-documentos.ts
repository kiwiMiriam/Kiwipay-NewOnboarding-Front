import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";
import { ProspectoApiService, DocumentoData } from '@app/core/services/prospecto-api.service';
import { DocumentoService } from '@app/core/services/documento.service';
import { DocumentType } from '@app/core/models/document.model';
import { downloadFileFromBlob } from '@src/app/shared/utils/file.utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GuarantorDocumentsComponent } from '@src/app/shared/components/guarantor-documents/guarantor-documents.component';
import { GuarantorDocumentService } from '@app/core/services/guarantor-document.service';

@Component({
  selector: 'app-prospecto-documentos',
  imports: [CommonModule, DocumentTableComponent, GuarantorDocumentsComponent],
  template: `
  <div class="section-container">
    <!-- Nueva sección de Documentos del Aval -->
    <app-guarantor-documents
      [clientId]="clientId"
      [hasGuarantor]="hasGuarantor">
    </app-guarantor-documents>
    <div class="documentos-section">
      <h2>Documentos del Asociado</h2>
      <app-document-table
        [documentos]="documentosAsociadoList"
        [obtenerNombreTipoDocumento]="obtenerNombreTipoDocumento.bind(this)"
        (subir)="onSubirAsociado($event)"
        (descargar)="onDescargarAsociado($event)"
        (aprobar)="onAprobarAsociado($event)"
        (rechazar)="onRechazarAsociado($event)">
      </app-document-table>
    </div>
    <div class="documentos-section">
      <h2>Ficha de riesgo del Asociado</h2>
      <app-document-table
        [documentos]="documentosRiesgoList"
        [obtenerNombreTipoDocumento]="obtenerNombreTipoDocumento.bind(this)"
        (subir)="onSubirRiesgo($event)"
        (descargar)="onDescargarRiesgo($event)"
        (aprobar)="onAprobarRiesgo($event)"
        (rechazar)="onRechazarRiesgo($event)">
      </app-document-table>
    </div>
    
  </div>
  `,
  styleUrls: ['./prospecto-documentos.css'],
})
export class ProspectoDocumentos implements OnInit, OnChanges, OnDestroy {
  @Input() documentosAsociado?: DocumentoData[];
  @Input() documentosRiesgo?: DocumentoData[];
  @Input() clientId?: number;

  documentosAsociadoList: DocumentoData[] = [];
  documentosRiesgoList: DocumentoData[] = [];
  isLoading = false;
  documentTypes: DocumentType[] = [];
  hasGuarantor = false;
  private destroy$ = new Subject<void>();

  constructor(
    private prospectoApiService: ProspectoApiService,
    private documentoService: DocumentoService,
    private guarantorDocumentService: GuarantorDocumentService
  ) {}

  ngOnInit(): void {
    // Cargar tipos de documentos
    this.loadDocumentTypes();
    
    // Si hay clientId, cargar documentos desde el backend
    if (this.clientId) {
      this.loadDocumentsFromBackend(this.clientId);
      this.checkForGuarantor(this.clientId);
    } else {
      this.updateDocumentos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      const newClientId = changes['clientId'].currentValue;
      if (newClientId) {
        this.loadDocumentsFromBackend(newClientId);
        this.checkForGuarantor(newClientId);
      }
    } else if (changes['documentosAsociado'] || changes['documentosRiesgo']) {
      this.updateDocumentos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar los tipos de documentos desde el backend
   */
  private loadDocumentTypes(): void {
    this.documentoService.getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.documentTypes = types;
          console.log('Document types loaded:', types);
        },
        error: (error) => {
          console.error('Error loading document types:', error);
        }
      });
  }

  /**
   * Cargar documentos desde el backend
   */
  private loadDocumentsFromBackend(clientId: number): void {
    this.isLoading = true;
    console.log('Loading documents for clientId:', clientId);

    // Cargar documentos NO riesgo
    this.prospectoApiService.getNonRiskDocuments(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docs) => {
          console.log('Non-risk documents loaded:', docs);
          this.documentosAsociadoList = docs;
        },
        error: (error) => {
          console.error('Error loading non-risk documents:', error);
          this.documentosAsociadoList = [];
        }
      });

    // Cargar documentos de riesgo
    this.prospectoApiService.getRiskDocuments(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docs) => {
          console.log('Risk documents loaded:', docs);
          this.documentosRiesgoList = docs;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading risk documents:', error);
          this.documentosRiesgoList = [];
          this.isLoading = false;
        }
      });
  }

  private updateDocumentos(): void {
    this.documentosAsociadoList = this.documentosAsociado ? [...this.documentosAsociado] : [];
    this.documentosRiesgoList = this.documentosRiesgo ? [...this.documentosRiesgo] : [];
  }

  // Métodos para documentos del asociado
  onSubirAsociado(event: { documento: DocumentoData; archivo: File }): void {
    console.log('Subir archivo asociado:', event);
    // Aquí se implementaría la lógica para subir el archivo
    // Por ahora solo actualizamos el nombre del documento
    const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosAsociadoList[index] = {
        ...this.documentosAsociadoList[index],
        nombre: event.archivo.name,
        fechaCarga: new Date()
      };
    }
  }

  onDescargarAsociado(doc: DocumentoData): void {
    if (!doc.id) {
      console.error('Document ID is required for download');
      alert('No se puede descargar el documento: ID no disponible');
      return;
    }

    console.log('Downloading non-risk document:', doc.id);
    this.documentoService.getDocumentContent(doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const fileName = doc.nombre || 'documento-sin-nombre';
          downloadFileFromBlob(blob, fileName);
          console.log('Document downloaded successfully');
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          alert('Error al descargar el documento');
        }
      });
  }

  onAprobarAsociado(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for approval');
      return;
    }

    console.log('Approving non-risk document:', event.documento.id);
    this.prospectoApiService.reviewDocument(event.documento.id, 'APPROVED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document approved successfully');
          // Actualizar la tabla localmente
          const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosAsociadoList[index] = {
              ...this.documentosAsociadoList[index],
              estadoRevision: 'APPROVED',
              comentario: event.comentario,
              fechaRevision: new Date().toISOString()
            };
          }
          // Refrescar desde el backend
          if (this.clientId) {
            this.loadDocumentsFromBackend(this.clientId);
          }
          alert('Documento aprobado exitosamente');
        },
        error: (error) => {
          console.error('Error approving document:', error);
          alert('Error al aprobar el documento');
        }
      });
  }

  onRechazarAsociado(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for rejection');
      return;
    }

    console.log('Rejecting non-risk document:', event.documento.id);
    this.prospectoApiService.reviewDocument(event.documento.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document rejected successfully');
          // Actualizar la tabla localmente
          const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosAsociadoList[index] = {
              ...this.documentosAsociadoList[index],
              estadoRevision: 'REJECTED',
              comentario: event.comentario,
              fechaRevision: new Date().toISOString()
            };
          }
          // Refrescar desde el backend
          if (this.clientId) {
            this.loadDocumentsFromBackend(this.clientId);
          }
          alert('Documento rechazado exitosamente');
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          alert('Error al rechazar el documento');
        }
      });
  }

  // Métodos para ficha de riesgo
  onSubirRiesgo(event: { documento: DocumentoData; archivo: File }): void {
    console.log('Subir archivo riesgo:', event);
    const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosRiesgoList[index] = {
        ...this.documentosRiesgoList[index],
        nombre: event.archivo.name,
        fechaCarga: new Date()
      };
    }
  }

  onDescargarRiesgo(doc: DocumentoData): void {
    if (!doc.id) {
      console.error('Document ID is required for download');
      alert('No se puede descargar el documento: ID no disponible');
      return;
    }

    console.log('Downloading risk document:', doc.id);
    // Usar el servicio de documentos para descargar como Blob
    this.documentoService.getDocumentContent(doc.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const fileName = doc.nombre || 'documento-sin-nombre';
          downloadFileFromBlob(blob, fileName);
          console.log('Document downloaded successfully');
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          alert('Error al descargar el documento');
        }
      });
  }

  onAprobarRiesgo(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for approval');
      return;
    }

    console.log('Approving risk document:', event.documento.id);
    this.prospectoApiService.reviewDocument(event.documento.id, 'APPROVED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document approved successfully');
          // Actualizar la tabla localmente
          const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosRiesgoList[index] = {
              ...this.documentosRiesgoList[index],
              estadoRevision: 'APPROVED',
              comentario: event.comentario,
              fechaRevision: new Date().toISOString()
            };
          }
          // Refrescar desde el backend
          if (this.clientId) {
            this.loadDocumentsFromBackend(this.clientId);
          }
          alert('Documento aprobado exitosamente');
        },
        error: (error) => {
          console.error('Error approving document:', error);
          alert('Error al aprobar el documento');
        }
      });
  }

  onRechazarRiesgo(event: { documento: DocumentoData; comentario: string }): void {
    if (!event.documento.id) {
      console.error('Document ID is required for rejection');
      return;
    }

    console.log('Rejecting risk document:', event.documento.id);
    this.prospectoApiService.reviewDocument(event.documento.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document rejected successfully');
          // Actualizar la tabla localmente
          const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosRiesgoList[index] = {
              ...this.documentosRiesgoList[index],
              estadoRevision: 'REJECTED',
              comentario: event.comentario,
              fechaRevision: new Date().toISOString()
            };
          }
          // Refrescar desde el backend
          if (this.clientId) {
            this.loadDocumentsFromBackend(this.clientId);
          }
          alert('Documento rechazado exitosamente');
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          alert('Error al rechazar el documento');
        }
      });
  }

  /**
   * Obtener el nombre del tipo de documento
   */
  obtenerNombreTipoDocumento(tipoId: string | undefined): string {
    if (!tipoId) return 'Sin tipo';
    const tipo = this.documentTypes.find(t => t.id === tipoId);
    return tipo ? tipo.name : tipoId;
  }

  /**
   * Verificar si existe un aval para mostrar la sección de documentos del aval
   */
  private checkForGuarantor(clientId: number): void {
    this.guarantorDocumentService.checkGuarantorExists(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guarantor) => {
          this.hasGuarantor = !!guarantor;
          console.log('Guarantor check result:', this.hasGuarantor);
        },
        error: (error) => {
          console.log('No guarantor found for client:', clientId);
          this.hasGuarantor = false;
        }
      });
  }
}
