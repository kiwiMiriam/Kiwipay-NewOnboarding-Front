import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent, FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faUpload, faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

export enum DocumentoEstado {
  Pendiente = 'Pendiente',
  Aprobado = 'Aprobado',
  Rechazado = 'Rechazado',
  EnRevision = 'En revisión'
}

interface Documento {
  id?: number;
  nombre: string;
  fechaCarga: Date;
  fechaRevision?: Date | null;
  comentario?: string;
  estadoRevision: DocumentoEstado;
}



@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [CommonModule, FaIconComponent, FontAwesomeModule],
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
            <td [ngClass]="doc.estadoRevision.toLowerCase()">{{ doc.estadoRevision }}</td>
            <td class="acciones">
              <button (click)="onSubir(doc)" title="Subir archivo">
                 <fa-icon [icon]="faUpload"></fa-icon>
              </button>
              <button (click)="onDescargar(doc)" title="Descargar archivo">
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
  `,
  styleUrls: ['./documenttable.component.scss'],
})
export class DocumentTableComponent {
    /** ✅ Array recibido desde el componente padre */
  @Input() documentos : Documento[] = [];


  @Output() subir = new EventEmitter<Documento>();
  @Output() descargar = new EventEmitter<Documento>();
  @Output() aprobar = new EventEmitter<Documento>();
  @Output() rechazar = new EventEmitter<Documento>();
  /** Íconos FontAwesome */
faUpload= faUpload;
faDownload= faDownload;
faCheck= faCheck;
faTimes= faTimes;

  /** Métodos que emiten los eventos al padre */
  onSubir(doc: Documento): void {
    console.log('Subir archivo para:', doc);
    // Lógica para subir archivo
  }

  onDescargar(doc: Documento): void {
    console.log('Descargar archivo para:', doc);
    // Lógica para descargar archivo
  }

  onAprobar(doc: Documento): void {
    console.log('Aprobar archivo para:', doc);
    // Lógica para aprobar archivo
  }

  onRechazar(doc: Documento): void {
    console.log('Rechazar archivo para:', doc);
    // Lógica para rechazar archivo

 }
}
