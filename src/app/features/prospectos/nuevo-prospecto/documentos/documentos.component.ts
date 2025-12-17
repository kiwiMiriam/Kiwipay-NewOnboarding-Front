import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { DocumentoService } from '../../../../core/services/documento.service';
import { ProspectosService, Prospecto } from '../../../../core/services/prospectos.service';
import { faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  DocumentType, 
  Document, 
  CreateDocumentRequest,
  DocumentStatus 
} from '../../../../core/models/document.model';
import { 
  fileToBase64, 
  downloadFileFromBlob
} from '../../../../shared/utils/file.utils';

// Interface local para documentos con archivos (antes de subir)
export interface DocumentoLocal {
  id: string;
  tipo: string;
  archivo: File;
  comentario: string;
  fecha: Date;
  estadoAprobacion: 'sin-estado' | 'aprobado' | 'rechazado';
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss']
})
export default class DocumentosComponent implements OnInit {

  faTrash = faTrash;
  faDownload = faDownload;

  // Constants
  readonly MAX_DOCUMENTOS = 10;
  TIPOS_PERMITIDOS: DocumentType[] = [];
  readonly FORMATOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  readonly EXTENSION_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png'];

  // Variables
  documentos: Document[] = [];
  tipoDocumentoSeleccionado = '';
  archivoSeleccionado: File | null = null;
  comentario = '';
  mensajeError = '';
  
  // Client ID
  clientId: number | null = null;
  prospectoId: string | null = null;
  editMode = false;
  
  // Loading states
  isLoading = false;
  isUploadingDocument = false;

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

  onTipoDocumentoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.tipoDocumentoSeleccionado = target.value;
  }

  onArchivoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const archivo = target.files[0];
      if (!this.validarFormatoArchivo(archivo)) {
        this.mensajeError = `Formato no permitido. Por favor, sube archivos en formato: ${this.EXTENSION_PERMITIDAS.join(', ')}`;
        this.archivoSeleccionado = null;
        return;
      }
      this.archivoSeleccionado = archivo;
      this.mensajeError = '';
    }
  }

  validarFormatoArchivo(archivo: File): boolean {
    const extension = '.' + archivo.name.split('.').pop()?.toLowerCase();
    return this.EXTENSION_PERMITIDAS.includes(extension) &&
           this.FORMATOS_PERMITIDOS.includes(archivo.type);
  }

  /**
   * Agregar documento - convierte a Base64 y hace POST al backend
   */
  async agregarDocumento(): Promise<void> {
    if (!this.clientId) {
      this.mensajeError = 'No se ha identificado el cliente. Por favor, guarda los datos del cliente primero.';
      return;
    }

    if (this.documentos.length >= this.MAX_DOCUMENTOS) {
      this.mensajeError = `Has alcanzado el límite de ${this.MAX_DOCUMENTOS} documentos.`;
      return;
    }

    if (!this.tipoDocumentoSeleccionado || !this.archivoSeleccionado) {
      this.mensajeError = 'Por favor, selecciona un tipo de documento y un archivo.';
      return;
    }

    try {
      this.isUploadingDocument = true;
      this.mensajeError = '';

      // Convertir archivo a Base64
      const contentBase64 = await fileToBase64(this.archivoSeleccionado);

      // Preparar el request
      const request: CreateDocumentRequest = {
        documentTypeId: this.tipoDocumentoSeleccionado,
        filename: this.archivoSeleccionado.name,
        mimeType: this.archivoSeleccionado.type,
        sizeBytes: this.archivoSeleccionado.size,
        comment: this.comentario || undefined,
        contentBase64: contentBase64
      };

      // Hacer POST al backend
      this.documentoService.createDocument(this.clientId, request).subscribe({
        next: (document) => {
          // Agregar el documento a la lista
          this.documentos.push(document);
          
          // Limpiar el formulario
          this.limpiarFormulario();
          this.isUploadingDocument = false;
        },
        error: (error) => {
          console.error('Error al subir documento:', error);
          this.mensajeError = 'Error al subir el documento. Por favor, intenta nuevamente.';
          this.isUploadingDocument = false;
        }
      });
    } catch (error) {
      console.error('Error al convertir archivo:', error);
      this.mensajeError = 'Error al procesar el archivo.';
      this.isUploadingDocument = false;
    }
  }

  /**
   * Limpiar el formulario de carga
   */
  private limpiarFormulario(): void {
    this.tipoDocumentoSeleccionado = '';
    this.archivoSeleccionado = null;
    this.comentario = '';
    this.mensajeError = '';

    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Eliminar un documento
   */
  eliminarDocumento(id: string): void {
    if (!id) return;

    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      this.documentoService.deleteDocument(id).subscribe({
        next: () => {
          this.documentos = this.documentos.filter(doc => doc.id !== id);
        },
        error: (error) => {
          console.error('Error al eliminar documento:', error);
          this.mensajeError = 'Error al eliminar el documento.';
        }
      });
    }
  }

  /**
   * Descargar un documento
   */
  descargarDocumento(documento: Document): void {
    this.documentoService.getDocumentContent(documento.id).subscribe({
      next: (blob: Blob) => {
        downloadFileFromBlob(blob, documento.filename);
      },
      error: (error) => {
        console.error('Error al descargar documento:', error);
        this.mensajeError = 'Error al descargar el documento.';
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

  // Métodos de aprobación/rechazo removidos - ahora están en el componente ADV

  navigateBack(): void {
    this.navigationService.navigateToTab('cotizador');
  }

  navigateNext(): void {
    this.navigationService.navigateToTab('cliente');
  }
}
