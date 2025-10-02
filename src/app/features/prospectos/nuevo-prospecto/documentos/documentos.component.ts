import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Documento {
  id: number;
  tipo: string;
  archivo: File;
  comentario: string;
  fecha: Date;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss']
})
export class DocumentosComponent {
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

  /**
   * Maneja el cambio de tipo de documento
   */
  onTipoDocumentoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.tipoDocumentoSeleccionado = target.value;
  }

  /**
   * Maneja la selección de archivo
   */
  onArchivoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const archivo = target.files[0];

      // Validar formato
      if (!this.validarFormatoArchivo(archivo)) {
        this.mensajeError = `Formato no permitido. Por favor, sube archivos en formato: ${this.EXTENSION_PERMITIDAS.join(', ')}`;
        this.archivoSeleccionado = null;
        return;
      }

      this.archivoSeleccionado = archivo;
      this.mensajeError = '';
    }
  }

  /**
   * Valida que el archivo tenga un formato permitido
   */
  validarFormatoArchivo(archivo: File): boolean {
    const extension = '.' + archivo.name.split('.').pop()?.toLowerCase();
    return this.EXTENSION_PERMITIDAS.includes(extension) &&
           this.FORMATOS_PERMITIDOS.includes(archivo.type);
  }

  /**
   * Agrega un documento a la lista
   */
  agregarDocumento(): void {
    // Validar que no se exceda el límite de documentos
    if (this.documentos.length >= this.MAX_DOCUMENTOS) {
      this.mensajeError = `Has alcanzado el límite de ${this.MAX_DOCUMENTOS} documentos.`;
      return;
    }

    // Validar que se haya seleccionado un tipo y un archivo
    if (!this.tipoDocumentoSeleccionado || !this.archivoSeleccionado) {
      this.mensajeError = 'Por favor, selecciona un tipo de documento y un archivo.';
      return;
    }

    // Agregar el documento
    const nuevoDocumento: Documento = {
      id: Date.now(), // Usar timestamp como ID temporal
      tipo: this.tipoDocumentoSeleccionado,
      archivo: this.archivoSeleccionado,
      comentario: this.comentario,
      fecha: new Date()
    };

    this.documentos.push(nuevoDocumento);

    // Limpiar campos
    this.tipoDocumentoSeleccionado = '';
    this.archivoSeleccionado = null;
    this.comentario = '';
    this.mensajeError = '';

    // Limpiar el input file
    const fileInput = document.getElementById('archivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Elimina un documento de la lista
   */
  eliminarDocumento(id: number): void {
    this.documentos = this.documentos.filter(doc => doc.id !== id);
  }

  /**
   * Obtiene el nombre legible del tipo de documento
   */
  obtenerNombreTipoDocumento(tipoId: string): string {
    const tipo = this.TIPOS_PERMITIDOS.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : tipoId;
  }

  /**
   * Obtiene el icono correspondiente al tipo de archivo
   * @deprecated Use obtenerClaseIconoArchivo instead
   */
  obtenerIconoArchivo(archivo: File): string {
    if (archivo.type === 'application/pdf') {
      return 'far fa-file-pdf';
    } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(archivo.type)) {
      return 'far fa-file-image';
    }
    return 'far fa-file';
  }

  /**
   * Obtiene la clase CSS para el icono correspondiente al tipo de archivo
   */
  obtenerClaseIconoArchivo(archivo: File): string {
    if (archivo.type === 'application/pdf') {
      return 'icon-pdf';
    } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(archivo.type)) {
      return 'icon-image';
    }
    return '';
  }

  /**
   * Formatea el tamaño del archivo para mostrarlo de forma legible
   */
  formatearTamanoArchivo(tamano: number): string {
    if (tamano < 1024) {
      return tamano + ' B';
    } else if (tamano < 1024 * 1024) {
      return (tamano / 1024).toFixed(2) + ' KB';
    } else {
      return (tamano / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }
}
