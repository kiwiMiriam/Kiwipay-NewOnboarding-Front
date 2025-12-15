import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";
import { ProspectoApiService, DocumentoData, ConyugeData } from '@app/core/services/prospecto-api.service';
import { DocumentoService } from '@app/core/services/documento.service';
import { ConyugeService } from '@app/core/services/conyuge.service';
import { DocumentType } from '@app/core/models/document.model';
import { downloadFileFromBlob } from '@src/app/shared/utils/file.utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GuarantorDocumentsComponent } from '@src/app/shared/components/guarantor-documents/guarantor-documents.component';
import { GuarantorDocumentService } from '@app/core/services/guarantor-document.service';

@Component({
  selector: 'app-prospecto-documentos',
  imports: [CommonModule, ReactiveFormsModule, DocumentTableComponent, GuarantorDocumentsComponent],
  template: `
  <div class="section-container">
    <!-- Nueva sección de Documentos del Aval -->
    <app-guarantor-documents
      [clientId]="clientId"
      [hasGuarantor]="hasGuarantor">
    </app-guarantor-documents>
    
    <!-- Sección de Datos del Cónyuge -->
    <div class="conyuge-section">
      <div class="section-header">
        <h2>Datos del Cónyuge</h2>
        <button class="btn-toggle" (click)="toggleConyugeSection()">
          {{ isConyugeExpanded ? 'Contraer' : 'Expandir' }}
        </button>
      </div>
      
      @if (isConyugeExpanded && conyugeForm) {
        <form [formGroup]="conyugeForm" (ngSubmit)="updateConyuge()">
          <div class="form-row">
            <div class="form-group">
              <label for="conyugueTipoDocumento">Tipo de Documento</label>
              <select id="conyugueTipoDocumento" formControlName="tipoDocumento">
                <option value="">Seleccione...</option>
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div class="form-group">
              <label for="conyugueNumeroDocumento">Número de Documento</label>
              <input type="text" id="conyugueNumeroDocumento" formControlName="numeroDocumento">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="conyugueNombres">Nombres</label>
              <input type="text" id="conyugueNombres" formControlName="nombres">
            </div>
            <div class="form-group">
              <label for="conyugueApellidos">Apellidos</label>
              <input type="text" id="conyugueApellidos" formControlName="apellidos">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="conyugueCorreo">Correo Electrónico</label>
              <input type="email" id="conyugueCorreo" formControlName="correo">
            </div>
            <div class="form-group">
              <label for="conyugueTelefono">Teléfono</label>
              <input type="tel" id="conyugueTelefono" formControlName="telefono">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="isUpdatingConyuge">
              {{ isUpdatingConyuge ? 'Actualizando...' : 'Actualizar Datos' }}
            </button>
            <button type="button" class="btn-secondary" (click)="resetConyugeForm()">
              Cancelar
            </button>
          </div>
        </form>
      }
    </div>
    
    <div class="documentos-section">
      <h2>Documentos del Asociado</h2>
      <app-document-table
        [documentos]="documentosAsociadoList"
        [obtenerNombreTipoDocumento]="obtenerNombreTipoDocumento.bind(this)"
        (descargar)="onDescargarAsociado($event)"
        (aprobar)="onAprobarAsociado($event)"
        (rechazar)="onRechazarAsociado($event)">
      </app-document-table>
    </div>
    <div class="documentos-section">
      <h2>Ficha de riesgo del Asociado</h2>
      <p>Haz clic en el icono de subida para cargar el documento</p>
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
  
  conyugeForm?: FormGroup;
  isConyugeExpanded = false;
  isUpdatingConyuge = false;
  currentConyuge?: ConyugeData;
  
  private destroy$ = new Subject<void>();

  constructor(
    private prospectoApiService: ProspectoApiService,
    private documentoService: DocumentoService,
    private guarantorDocumentService: GuarantorDocumentService,
    private formBuilder: FormBuilder,
    private conyugeService: ConyugeService
  ) {
    this.initializeConyugeForm();
  }

  ngOnInit(): void {
    this.loadDocumentTypes();
  
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
    this.documentoService.reviewDocument(event.documento.id, 'APPROVED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document approved successfully');
          // Actualizar la tabla localmente
          const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosAsociadoList[index] = {
              ...this.documentosAsociadoList[index],
              estadoRevision: 'Aprobado',
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
    this.documentoService.reviewDocument(event.documento.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document rejected successfully');
          // Actualizar la tabla localmente
          const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosAsociadoList[index] = {
              ...this.documentosAsociadoList[index],
              estadoRevision: 'Rechazado',
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
    this.documentoService.reviewDocument(event.documento.id, 'APPROVED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document approved successfully');
          // Actualizar la tabla localmente
          const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosRiesgoList[index] = {
              ...this.documentosRiesgoList[index],
              estadoRevision: 'Aprobado',
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
    this.documentoService.reviewDocument(event.documento.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Document rejected successfully');
          // Actualizar la tabla localmente
          const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
          if (index !== -1) {
            this.documentosRiesgoList[index] = {
              ...this.documentosRiesgoList[index],
              estadoRevision: 'Rechazado',
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

  /**
   * Inicializar formulario del cónyuge
   */
  private initializeConyugeForm(): void {
    this.conyugeForm = this.formBuilder.group({
      tipoDocumento: [''],
      numeroDocumento: [''],
      nombres: [''],
      apellidos: [''],
      correo: [''],
      telefono: ['']
    });
  }

  /**
   * Toggle sección del cónyuge
   */
  toggleConyugeSection(): void {
    this.isConyugeExpanded = !this.isConyugeExpanded;
    if (this.isConyugeExpanded && this.clientId) {
      this.loadConyugeData();
    }
  }

  /**
   * Cargar datos del cónyuge
   */
  private loadConyugeData(): void {
    if (!this.clientId) return;
    
    this.conyugeService.getConyugeByClientId(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conyuge) => {
          this.currentConyuge = conyuge || undefined;
          if (conyuge && this.conyugeForm) {
            this.conyugeForm.patchValue({
              tipoDocumento: conyuge.tipoDocumento || conyuge.documentType || '',
              numeroDocumento: conyuge.numeroDocumento || conyuge.documentNumber || '',
              nombres: conyuge.nombres || conyuge.firstNames || '',
              apellidos: conyuge.apellidos || conyuge.lastNames || '',
              correo: conyuge.correo || conyuge.email || '',
              telefono: conyuge.telefono || conyuge.phone || ''
            });
          }
        },
        error: (error) => {
          console.error('Error loading cónyuge data:', error);
          this.currentConyuge = undefined;
        }
      });
  }

  /**
   * Actualizar datos del cónyuge
   */
  updateConyuge(): void {
    if (!this.clientId || !this.conyugeForm || this.conyugeForm.invalid) {
      return;
    }

    this.isUpdatingConyuge = true;
    const formData = this.conyugeForm.value;
    
    const conyugeData: ConyugeData = {
      id: this.currentConyuge?.id,
      clientId: this.clientId,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      correo: formData.correo,
      telefono: formData.telefono,
      // Campos para backend compatibility
      documentType: formData.tipoDocumento,
      documentNumber: formData.numeroDocumento,
      firstNames: formData.nombres,
      lastNames: formData.apellidos,
      email: formData.correo,
      phone: formData.telefono
    };

    const operation = this.currentConyuge ? 
      this.conyugeService.actualizarConyuge(this.clientId, conyugeData) :
      this.conyugeService.crearConyuge(this.clientId, conyugeData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          console.log('Cónyuge actualizado exitosamente:', resultado);
          this.currentConyuge = resultado;
          this.isUpdatingConyuge = false;
          alert(this.currentConyuge ? 'Datos del cónyuge actualizados correctamente' : 'Datos del cónyuge creados correctamente');
        },
        error: (error) => {
          console.error('Error updating cónyuge:', error);
          this.isUpdatingConyuge = false;
          alert('Error al actualizar los datos del cónyuge');
        }
      });
  }

  /**
   * Reset formulario del cónyuge
   */
  resetConyugeForm(): void {
    if (this.conyugeForm) {
      if (this.currentConyuge) {
        // Si existe cónyuge, restaurar datos originales
        this.conyugeForm.patchValue({
          tipoDocumento: this.currentConyuge.tipoDocumento || this.currentConyuge.documentType || '',
          numeroDocumento: this.currentConyuge.numeroDocumento || this.currentConyuge.documentNumber || '',
          nombres: this.currentConyuge.nombres || this.currentConyuge.firstNames || '',
          apellidos: this.currentConyuge.apellidos || this.currentConyuge.lastNames || '',
          correo: this.currentConyuge.correo || this.currentConyuge.email || '',
          telefono: this.currentConyuge.telefono || this.currentConyuge.phone || ''
        });
      } else {
        // Si no existe cónyuge, limpiar formulario
        this.conyugeForm.reset();
      }
    }
  }
}
