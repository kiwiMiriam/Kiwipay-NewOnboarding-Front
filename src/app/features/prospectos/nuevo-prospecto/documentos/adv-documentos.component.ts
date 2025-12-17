import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { DocumentoService } from '../../../../core/services/documento.service';
import { ProspectosService, Prospecto } from '../../../../core/services/prospectos.service';
import { faCheck, faTimes, faComment } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  DocumentType, 
  Document,
  DocumentStatus 
} from '../../../../core/models/document.model';
import { ModalAccionComponent } from './modal-accion/modal-accion.component';

@Component({
  selector: 'app-adv-documentos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    ModalAccionComponent
  ],
  templateUrl: './adv-documentos.component.html',
  styleUrls: ['./adv-documentos.component.scss']
})
export default class AdvDocumentosComponent implements OnInit {

  faCheck = faCheck;
  faTimes = faTimes;

  // Variables
  documentos: Document[] = [];
  TIPOS_PERMITIDOS: DocumentType[] = [];
  mensajeError = '';
  
  // Client ID
  clientId: number | null = null;
  prospectoId: string | null = null;
  editMode = false;
  
  // Loading states
  isLoading = false;

  // Modal state
  mostrarModalAccion = false;
  documentoSeleccionado: Document | null = null;
  accionSeleccionada: 'aprobar' | 'rechazar' = 'aprobar';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService,
    private documentoService: DocumentoService,
    private prospectosService: ProspectosService
  ) {}

  ngOnInit(): void {
    // Cargar tipos de documentos
    this.loadDocumentTypes();
    
    // Obtener clientId de la ruta o del servicio de prospectos
    this.route.queryParams.subscribe(params => {
      this.prospectoId = params['id'];
      if (this.prospectoId) {
        this.editMode = true;
        this.clientId = Number(this.prospectoId);
        this.loadClientDocuments();
      }
    });
  }

  /**
   * Cargar los tipos de documentos desde el backend
   */
  private loadDocumentTypes(): void {
    this.documentoService.getDocumentTypes().subscribe({
      next: (types) => {
        this.TIPOS_PERMITIDOS = types;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documentos:', error);
        this.mensajeError = 'No se pudieron cargar los tipos de documentos.';
      }
    });
  }

  /**
   * Cargar los documentos existentes del cliente
   */
  private loadClientDocuments(): void {
    if (!this.clientId) return;
    
    this.isLoading = true;
    this.documentoService.getClientDocuments(this.clientId).subscribe({
      next: (documents) => {
        this.documentos = documents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.isLoading = false;
      }
    });
  }

  obtenerNombreTipoDocumento(tipoId: string): string {
    const tipo = this.TIPOS_PERMITIDOS.find(t => t.id === tipoId);
    return tipo ? tipo.name : tipoId;
  }

  obtenerClaseIconoArchivo(mimeType: string): string {
    if (mimeType === 'application/pdf') {
      return 'icon-pdf';
    } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)) {
      return 'icon-image';
    }
    return '';
  }

  formatearTamanoArchivo(tamano: number): string {
    if (tamano < 1024) {
      return tamano + ' B';
    } else if (tamano < 1024 * 1024) {
      return (tamano / 1024).toFixed(2) + ' KB';
    } else {
      return (tamano / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  obtenerClaseIconoEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'APPROVED':
        return 'estado-icon aprobado';
      case 'REJECTED':
        return 'estado-icon rechazado';
      case 'READY':
      case 'PENDING':
      default:
        return 'estado-icon sin-estado';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'READY':
        return 'Listo';
      case 'PENDING':
        return 'Pendiente';
      default:
        return 'Sin estado';
    }
  }

  /**
   * Abrir modal para aprobar documento
   */
  abrirModalAprobacion(documento: Document): void {
    this.documentoSeleccionado = documento;
    this.accionSeleccionada = 'aprobar';
    this.mostrarModalAccion = true;
  }

  /**
   * Abrir modal para rechazar documento
   */
  abrirModalRechazo(documento: Document): void {
    this.documentoSeleccionado = documento;
    this.accionSeleccionada = 'rechazar';
    this.mostrarModalAccion = true;
  }

  /**
   * Cerrar modal de acción
   */
  cerrarModalAccion(): void {
    this.mostrarModalAccion = false;
    this.documentoSeleccionado = null;
  }

  /**
   * Confirmar la acción desde el modal
   */
  confirmarAccion(comentario: string): void {
    if (!this.documentoSeleccionado?.id) return;

    const nuevoEstado = this.accionSeleccionada === 'aprobar' ? 'APPROVED' : 'REJECTED';

    // Pasar el comentario como tercer parámetro al servicio
    this.documentoService.reviewDocument(this.documentoSeleccionado.id, nuevoEstado, comentario.trim()).subscribe({
      next: () => {
        console.log(`Document ${nuevoEstado.toLowerCase()} successfully with comment:`, comentario);
        
        // Actualizar estado local inmediatamente
        const index = this.documentos.findIndex(doc => doc.id === this.documentoSeleccionado?.id);
        if (index !== -1) {
          this.documentos[index] = {
            ...this.documentos[index],
            reviewStatus: nuevoEstado,
            comment: comentario.trim(),
            reviewedAt: new Date().toISOString()
          };
        }
        
        // Recargar documentos desde el backend para asegurar sincronización
        this.loadClientDocuments();
        this.cerrarModalAccion();
      },
      error: (error) => {
        console.error('Error al actualizar estado del documento:', error);
        this.mensajeError = 'Error al actualizar el estado del documento.';
      }
    });
  }

  /**
   * Aprobar un documento rápidamente
   */
  aprobarDocumento(documento: Document): void {
    if (!documento.id) {
      console.error('Document ID is required for approval');
      return;
    }

    if (confirm('¿Estás seguro de que deseas aprobar este documento?')) {
      this.documentoService.reviewDocument(documento.id, 'APPROVED', '').subscribe({
        next: () => {
          console.log('Document approved successfully');
          
          // Actualizar estado local inmediatamente
          const index = this.documentos.findIndex(doc => doc.id === documento.id);
          if (index !== -1) {
            this.documentos[index] = {
              ...this.documentos[index],
              reviewStatus: 'APPROVED',
              reviewedAt: new Date().toISOString()
            };
          }
          // Recargar documentos desde el backend
          this.loadClientDocuments();
        },
        error: (error) => {
          console.error('Error approving document:', error);
          this.mensajeError = 'Error al aprobar el documento.';
        }
      });
    }
  }

  /**
   * Rechazar un documento rápidamente
   */
  rechazarDocumento(documento: Document): void {
    if (!documento.id) {
      console.error('Document ID is required for rejection');
      return;
    }

    if (confirm('¿Estás seguro de que deseas rechazar este documento?')) {
      this.documentoService.reviewDocument(documento.id, 'REJECTED', '').subscribe({
        next: () => {
          console.log('Document rejected successfully');
          
          // Actualizar estado local inmediatamente
          const index = this.documentos.findIndex(doc => doc.id === documento.id);
          if (index !== -1) {
            this.documentos[index] = {
              ...this.documentos[index],
              reviewStatus: 'REJECTED',
              reviewedAt: new Date().toISOString()
            };
          }
          // Recargar documentos desde el backend
          this.loadClientDocuments();
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          this.mensajeError = 'Error al rechazar el documento.';
        }
      });
    }
  }

  navigateBack(): void {
    this.navigationService.navigateToTab('documentos');
  }

  navigateNext(): void {
    this.navigationService.navigateToTab('prospecto');
  }
}