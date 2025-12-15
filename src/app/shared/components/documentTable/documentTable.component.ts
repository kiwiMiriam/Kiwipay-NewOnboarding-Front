import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faUpload, faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { DocumentoData } from '@app/core/services/prospecto-api.service';

export enum DocumentoEstado {
  Pendiente = 'Pendiente',
  Aprobado = 'Aprobado',
  Rechazado = 'Rechazado',
  EnRevision = 'En revisión'
}

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [CommonModule, FaIconComponent, FontAwesomeModule, FormsModule],
  styles: [`:host { display: block; }`],
  template: `
  <div class="document-table" (click)="$event.stopPropagation()">
    <table>
      <thead>
        <tr>
          <th>NRO</th>
          <th>Documento</th>
          <th>Fecha de carga</th>
          <th>Fecha de revision</th>
          <th>Comentario</th>
          <th>Estado de revision</th>
          <th class="acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let doc of documentos; let i = index">
           <td>{{ i + 1 }}</td>
            <td>
              <div class="document-info">
                <div class="document-type">{{ obtenerNombreTipo(doc) }}</div>
                <div class="document-name">{{ doc.nombre }}</div>
              </div>
            </td>
            <td>{{ doc.fechaCarga | date: 'shortDate' }}</td>
            <td>{{ doc.fechaRevision ? (doc.fechaRevision | date: 'shortDate') : '-' }}</td>
            <td>{{ doc.comentario || '-' }}</td>
            <td [ngClass]="doc.estadoRevision ? doc.estadoRevision.toLowerCase() : ''">{{ doc.estadoRevision || 'Pendiente' }}</td>
            <td class="acciones">
              <button (click)="onSubir(doc)" title="Subir archivo">
                 <fa-icon [icon]="faUpload"></fa-icon>
              </button>
              <button
                (click)="onDescargar(doc)"
                [disabled]="!doc.id"
                [class.disabled]="!doc.id"
                title="Descargar archivo">
                <fa-icon [icon]="faDownload"></fa-icon>
              </button>
              <button (click)="onAprobar(doc)" title="Aprobar archivo">
                <fa-icon [icon]="faCheck"></fa-icon>
              </button>
              <button (click)="onRechazar(doc)" title="Rechazar archivo">
                <fa-icon [icon]="faTimes"></fa-icon>
              </button>
            </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Modal para aprobar -->
  <div class="modal-overlay" *ngIf="mostrarModalAprobar" (click)="cerrarModalAprobar()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <h3>Aprobar Documento</h3>
      <div class="form-group">
        <label for="comentarioAprobar">Comentario (opcional)</label>
        <textarea
          id="comentarioAprobar"
          rows="3"
          [(ngModel)]="comentarioAprobar"
          placeholder="Ingrese un comentario"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" (click)="cerrarModalAprobar()">Cancelar</button>
        <button class="btn-primary" (click)="confirmarAprobar()">Aceptar</button>
      </div>
    </div>
  </div>

  <!-- Modal para rechazar -->
  <div class="modal-overlay" *ngIf="mostrarModalRechazar" (click)="cerrarModalRechazar()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <h3>Rechazar Documento</h3>
      <div class="form-group">
        <label for="comentarioRechazar">Comentario (opcional)</label>
        <textarea
          id="comentarioRechazar"
          rows="3"
          [(ngModel)]="comentarioRechazar"
          placeholder="Ingrese un comentario"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" (click)="cerrarModalRechazar()">Cancelar</button>
        <button class="btn-primary" (click)="confirmarRechazar()">Aceptar</button>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./documentTable.component.scss'],
})
export class DocumentTableComponent {
  @Input() documentos: DocumentoData[] = [];
  @Input() obtenerNombreTipoDocumento?: (tipoId: string | undefined) => string;
  @Output() private readonly subir = new EventEmitter<{ documento: DocumentoData; archivo: File }>();
  @Output() private readonly descargar = new EventEmitter<DocumentoData>();
  @Output() private readonly aprobar = new EventEmitter<{ documento: DocumentoData; comentario: string }>();
  @Output() private readonly rechazar = new EventEmitter<{ documento: DocumentoData; comentario: string }>();
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  protected readonly faUpload = faUpload;
  protected readonly faDownload = faDownload;
  protected readonly faCheck = faCheck;
  protected readonly faTimes = faTimes;

  protected mostrarModalSubir = false;
  protected mostrarModalAprobar = false;
  protected mostrarModalRechazar = false;
  protected documentoSeleccionado: DocumentoData | null = null;
  protected archivoSeleccionado: File | null = null;
  protected comentarioAprobar = '';
  protected comentarioRechazar = '';

  protected isEstadoPendiente(doc: DocumentoData): boolean {
    return !doc.estadoRevision || doc.estadoRevision.toLowerCase() === DocumentoEstado.Pendiente.toLowerCase();
  }

  protected isAccionDisabled(doc: DocumentoData): boolean {
    return this.isEstadoPendiente(doc) || !doc.url;
  }

  protected onSubir(doc: DocumentoData): void {
    this.resetState();
    this.documentoSeleccionado = doc;
    this.mostrarModalSubir = true;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  protected onAprobar(doc: DocumentoData): void {
    this.resetState();
    this.documentoSeleccionado = doc;
    this.comentarioAprobar = doc.comentario || '';
    this.mostrarModalAprobar = true;
  }

  protected onRechazar(doc: DocumentoData): void {
    this.resetState();
    this.documentoSeleccionado = doc;
    this.comentarioRechazar = doc.comentario || '';
    this.mostrarModalRechazar = true;
  }

  protected onDescargar(doc: DocumentoData): void {
    // Permitir descarga si el documento tiene ID, independientemente del estado o URL
    if (doc.id) {
      this.descargar.emit(doc);
    }
  }

  private resetState(): void {
    this.documentoSeleccionado = null;
    this.archivoSeleccionado = null;
    this.comentarioAprobar = '';
    this.comentarioRechazar = '';
    this.mostrarModalSubir = false;
    this.mostrarModalAprobar = false;
    this.mostrarModalRechazar = false;
  }

  protected onArchivoSeleccionado(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      const file = target.files[0];
      const isValidFileType = this.isValidFileType(file);
      const isValidFileSize = this.isValidFileSize(file);

      if (isValidFileType && isValidFileSize) {
        this.archivoSeleccionado = file;
      } else {
        this.archivoSeleccionado = null;
        if (!isValidFileType) {
          console.error('Tipo de archivo no válido. Solo se permiten archivos PDF, JPG, JPEG y PNG.');
        }
        if (!isValidFileSize) {
          console.error('El archivo excede el tamaño máximo permitido de 5MB.');
        }
      }
    }
  }

  protected cerrarModalSubir(): void {
    this.mostrarModalSubir = false;
    this.documentoSeleccionado = null;
    this.archivoSeleccionado = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  protected cerrarModalAprobar(): void {
    this.mostrarModalAprobar = false;
    this.documentoSeleccionado = null;
    this.comentarioAprobar = '';
  }

  protected cerrarModalRechazar(): void {
    this.mostrarModalRechazar = false;
    this.documentoSeleccionado = null;
    this.comentarioRechazar = '';
  }

  protected confirmarSubirArchivo(): void {
    if (this.documentoSeleccionado && this.archivoSeleccionado) {
      this.subir.emit({
        documento: this.documentoSeleccionado,
        archivo: this.archivoSeleccionado
      });
      this.cerrarModalSubir();
    }
  }

  protected confirmarAprobar(): void {
    if (this.documentoSeleccionado) {
      this.aprobar.emit({
        documento: this.documentoSeleccionado,
        comentario: this.comentarioAprobar.trim()
      });
      this.cerrarModalAprobar();
    }
  }

  protected confirmarRechazar(): void {
    if (this.documentoSeleccionado) {
      this.rechazar.emit({
        documento: this.documentoSeleccionado,
        comentario: this.comentarioRechazar.trim()
      });
      this.cerrarModalRechazar();
    }
  }

  private isValidFileType(file: File): boolean {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(file.type);
  }

  protected obtenerNombreTipo(doc: DocumentoData): string {
    if (this.obtenerNombreTipoDocumento && doc.documentTypeId) {
      return this.obtenerNombreTipoDocumento(doc.documentTypeId);
    }
    return doc.tipo || 'Sin tipo';
  }

  private isValidFileSize(file: File): boolean {
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSizeInBytes;
  }
}
