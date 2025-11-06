import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faUpload, faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { DocumentoData } from '@src/app/core/services/prospecto-api.service';

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
  template: `
  <div class="document-table">
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
            <td>{{ doc.nombre }}</td>
            <td>{{ doc.fechaCarga | date: 'shortDate' }}</td>
            <td>{{ doc.fechaRevision ? (doc.fechaRevision | date: 'shortDate') : '-' }}</td>
            <td>{{ doc.comentario || '-' }}</td>
            <td [ngClass]="doc.estadoRevision?.toLowerCase() || ''">{{ doc.estadoRevision || 'Pendiente' }}</td>
            <td class="acciones">
              <button (click)="onSubir(doc)" title="Subir archivo">
                 <fa-icon [icon]="faUpload"></fa-icon>
              </button>
              <button
                (click)="onDescargar(doc)"
                [disabled]="isEstadoPendiente(doc)"
                [class.disabled]="isEstadoPendiente(doc)"
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

  <!-- Modal para subir archivo -->
  <div class="modal-overlay" *ngIf="mostrarModalSubir" (click)="cerrarModalSubir()">
    <div class="modal-content" (click)="$event.stopPropagation()">
      <h3>Subir Archivo</h3>
      <div class="form-group">
        <label for="archivoSubir">Seleccionar archivo</label>
        <input
          type="file"
          id="archivoSubir"
          #fileInput
          (change)="onArchivoSeleccionado($event)"
          accept=".pdf,.jpg,.jpeg,.png"
          class="file-input"
          placeholder="Seleccionar archivo 1"/>
          <!--
        <p class="file-name hidden-input" *ngIf="archivoSeleccionado">{{ archivoSeleccionado.name }}</p> -->
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" (click)="cerrarModalSubir()">Cancelar</button>
        <button
          class="btn-primary"
          (click)="confirmarSubirArchivo()"
          [disabled]="!archivoSeleccionado">
          Aceptar
        </button>
      </div>
    </div>
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
  /** ✅ Array recibido desde el componente padre */
  @Input() documentos: DocumentoData[] = [];

  @Output() subir = new EventEmitter<{ documento: DocumentoData; archivo: File }>();
  @Output() descargar = new EventEmitter<DocumentoData>();
  @Output() aprobar = new EventEmitter<{ documento: DocumentoData; comentario: string }>();
  @Output() rechazar = new EventEmitter<{ documento: DocumentoData; comentario: string }>();

  /** Íconos FontAwesome */
  faUpload = faUpload;
  faDownload = faDownload;
  faCheck = faCheck;
  faTimes = faTimes;

  /** Variables para modales */
  mostrarModalSubir = false;
  mostrarModalAprobar = false;
  mostrarModalRechazar = false;
  documentoSeleccionado: DocumentoData | null = null;
  archivoSeleccionado: File | null = null;
  comentarioAprobar = '';
  comentarioRechazar = '';

  /** Verifica si el estado es Pendiente */
  isEstadoPendiente(doc: DocumentoData): boolean {
    return (doc.estadoRevision || 'Pendiente').toLowerCase() === 'pendiente';
  }

  /** Métodos para abrir modales */
  onSubir(doc: DocumentoData): void {
    this.documentoSeleccionado = doc;
    this.archivoSeleccionado = null;
    this.mostrarModalSubir = true;
  }

  onAprobar(doc: DocumentoData): void {
    this.documentoSeleccionado = doc;
    this.comentarioAprobar = doc.comentario || '';
    this.mostrarModalAprobar = true;
  }

  onRechazar(doc: DocumentoData): void {
    this.documentoSeleccionado = doc;
    this.comentarioRechazar = doc.comentario || '';
    this.mostrarModalRechazar = true;
  }

  onDescargar(doc: DocumentoData): void {
    if (!this.isEstadoPendiente(doc)) {
      this.descargar.emit(doc);
    }
  }

  /** Métodos para manejar archivo seleccionado */
  onArchivoSeleccionado(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.archivoSeleccionado = target.files[0];
    }
  }

  /** Métodos para cerrar modales */
  cerrarModalSubir(): void {
    this.mostrarModalSubir = false;
    this.documentoSeleccionado = null;
    this.archivoSeleccionado = null;
  }

  cerrarModalAprobar(): void {
    this.mostrarModalAprobar = false;
    this.documentoSeleccionado = null;
    this.comentarioAprobar = '';
  }

  cerrarModalRechazar(): void {
    this.mostrarModalRechazar = false;
    this.documentoSeleccionado = null;
    this.comentarioRechazar = '';
  }

  /** Métodos para confirmar acciones */
  confirmarSubirArchivo(): void {
    if (this.documentoSeleccionado && this.archivoSeleccionado) {
      this.subir.emit({
        documento: this.documentoSeleccionado,
        archivo: this.archivoSeleccionado
      });
      this.cerrarModalSubir();
    }
  }

  confirmarAprobar(): void {
    if (this.documentoSeleccionado) {
      this.aprobar.emit({
        documento: this.documentoSeleccionado,
        comentario: this.comentarioAprobar
      });
      this.cerrarModalAprobar();
    }
  }

  confirmarRechazar(): void {
    if (this.documentoSeleccionado) {
      this.rechazar.emit({
        documento: this.documentoSeleccionado,
        comentario: this.comentarioRechazar
      });
      this.cerrarModalRechazar();
    }
  }
}
