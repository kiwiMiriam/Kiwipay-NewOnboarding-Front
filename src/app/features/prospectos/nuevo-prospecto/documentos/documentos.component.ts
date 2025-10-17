import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { ModalEstadoComponent } from "./modal-estado/modal-estado.component";

interface Documento {
  id: number;
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
    ModalEstadoComponent
],
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss']
})
export class DocumentosComponent implements OnInit {
  // Constants
  readonly MAX_DOCUMENTOS = 10;
  readonly TIPOS_PERMITIDOS = [
    { id: 'dni', nombre: 'DNI' },
    { id: 'comprobante', nombre: 'Comprobante de pago' },
    { id: 'recibo', nombre: 'Recibo de servicios' },
    { id: 'contrato', nombre: 'Contrato' },
    { id: 'otros', nombre: 'Otros' }
  ];
  readonly FORMATOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  readonly EXTENSION_PERMITIDAS = ['.pdf', '.jpg', '.jpeg', '.png'];

  // Variables
  documentos: Documento[] = [];
  tipoDocumentoSeleccionado = '';
  archivoSeleccionado: File | null = null;
  comentario = '';
  mensajeError = '';

  // Modal variables
  mostrarModal = false;
  documentoSeleccionado: Documento | null = null;
  estadoAprobacionTemp: 'sin-estado' | 'aprobado' | 'rechazado' = 'sin-estado';
  comentarioAprobacionTemp = '';

  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    // Initialization code if needed
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

  agregarDocumento(): void {
    if (this.documentos.length >= this.MAX_DOCUMENTOS) {
      this.mensajeError = `Has alcanzado el límite de ${this.MAX_DOCUMENTOS} documentos.`;
      return;
    }

    if (!this.tipoDocumentoSeleccionado || !this.archivoSeleccionado) {
      this.mensajeError = 'Por favor, selecciona un tipo de documento y un archivo.';
      return;
    }

    const nuevoDocumento: Documento = {
      id: Date.now(),
      tipo: this.tipoDocumentoSeleccionado,
      archivo: this.archivoSeleccionado,
      comentario: this.comentario,
      fecha: new Date(),
      estadoAprobacion: 'sin-estado'
    };

    this.documentos.push(nuevoDocumento);
    this.tipoDocumentoSeleccionado = '';
    this.archivoSeleccionado = null;
    this.comentario = '';
    this.mensajeError = '';

    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  eliminarDocumento(id: number): void {
    this.documentos = this.documentos.filter(doc => doc.id !== id);
  }

  obtenerNombreTipoDocumento(tipoId: string): string {
    const tipo = this.TIPOS_PERMITIDOS.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : tipoId;
  }

  obtenerClaseIconoArchivo(archivo: File): string {
    if (archivo.type === 'application/pdf') {
      return 'icon-pdf';
    } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(archivo.type)) {
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

   // En la clase DocumentosComponent:

abrirModalEstado(documento: Documento): void {
  this.documentoSeleccionado = documento;
  this.mostrarModal = true;
}

onCerrarModal(): void {
  this.mostrarModal = false;
  this.documentoSeleccionado = null;
}

onGuardarEstado(event: { estadoAprobacion: 'sin-estado' | 'aprobado' | 'rechazado', comentario: string }): void {
  if (this.documentoSeleccionado) {
    const index = this.documentos.findIndex(doc => doc.id === this.documentoSeleccionado?.id);
    if (index !== -1) {
      this.documentos[index] = {
        ...this.documentos[index],
        estadoAprobacion: event.estadoAprobacion,
        comentario: event.comentario
      };
    }
  }
  this.onCerrarModal();
}

  obtenerClaseIconoEstado(estado: 'sin-estado' | 'aprobado' | 'rechazado'): string {
    switch (estado) {
      case 'aprobado':
        return 'estado-icon aprobado';
      case 'rechazado':
        return 'estado-icon rechazado';
      default:
        return 'estado-icon sin-estado';
    }
  }

  navigateBack(): void {
    this.navigationService.navigateToTab('cotizador');
  }

  navigateNext(): void {
    this.navigationService.navigateToTab('cliente');
  }
}
