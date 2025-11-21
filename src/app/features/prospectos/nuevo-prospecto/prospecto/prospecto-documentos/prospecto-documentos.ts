import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";
import { ProspectoApiService, DocumentoData } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto-documentos',
  imports: [CommonModule, DocumentTableComponent],
  template: `
  <div class="section-container">
    <div class="documentos-section">
      <h2>Documentos del Asociado</h2>
      <app-document-table
        [documentos]="documentosAsociadoList"
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
export class ProspectoDocumentos implements OnInit, OnChanges {
  @Input() documentosAsociado?: DocumentoData[];
  @Input() documentosRiesgo?: DocumentoData[];

  documentosAsociadoList: DocumentoData[] = [];
  documentosRiesgoList: DocumentoData[] = [];

  constructor(private prospectoApiService: ProspectoApiService) {}

  ngOnInit(): void {
    this.updateDocumentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentosAsociado'] || changes['documentosRiesgo']) {
      this.updateDocumentos();
    }
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
    console.log('Descargar archivo asociado:', doc);
    // Implementar lógica de descarga
  }

  onAprobarAsociado(event: { documento: DocumentoData; comentario: string }): void {
    const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosAsociadoList[index] = {
        ...this.documentosAsociadoList[index],
        estadoRevision: 'Aprobado',
        comentario: event.comentario,
        fechaRevision: new Date()
      };
    }
  }

  onRechazarAsociado(event: { documento: DocumentoData; comentario: string }): void {
    const index = this.documentosAsociadoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosAsociadoList[index] = {
        ...this.documentosAsociadoList[index],
        estadoRevision: 'Rechazado',
        comentario: event.comentario,
        fechaRevision: new Date()
      };
    }
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
    console.log('Descargar archivo riesgo:', doc);
    // Implementar lógica de descarga
  }

  onAprobarRiesgo(event: { documento: DocumentoData; comentario: string }): void {
    const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosRiesgoList[index] = {
        ...this.documentosRiesgoList[index],
        estadoRevision: 'Aprobado',
        comentario: event.comentario,
        fechaRevision: new Date()
      };
    }
  }

  onRechazarRiesgo(event: { documento: DocumentoData; comentario: string }): void {
    const index = this.documentosRiesgoList.findIndex(d => d.id === event.documento.id);
    if (index !== -1) {
      this.documentosRiesgoList[index] = {
        ...this.documentosRiesgoList[index],
        estadoRevision: 'Rechazado',
        comentario: event.comentario,
        fechaRevision: new Date()
      };
    }
  }
}
