import { Component } from '@angular/core';
import {  DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";

@Component({
  selector: 'app-prospecto-documentos',
  imports: [DocumentTableComponent],
  template: `
  <div>
    <div>
      <h2>Documentos del Asociado</h2>
      <app-document-table [documentos]="documentos"></app-document-table>
    </div>
    <div>
      <h2>Ficha de riesgo del Asociado</h2>
      <app-document-table [documentos]="documentos"></app-document-table>
    </div>
  </div>
  `,
  styleUrls: ['./prospecto-documentos.css'],
})
export class ProspectoDocumentos {

    // Datos de ejemplo para la tabla de documentos
    documentos = [
    {
        nombre: 'Contrato.pdf',
        fechaCarga: new Date('2025-10-10'),
        fechaRevision: new Date('2025-10-12'),
        comentario: 'Pendiente de aprobación',
        estadoRevision: DocumentoEstado.Pendiente
      },
      {
        nombre: 'Factura_123.pdf',
        fechaCarga: new Date('2025-10-15'),
        fechaRevision: new Date('2025-10-16'),
        comentario: 'Aprobado',
        estadoRevision: DocumentoEstado.Aprobado
      }
    ];
}
