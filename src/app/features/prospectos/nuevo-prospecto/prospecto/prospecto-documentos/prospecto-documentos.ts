import { Component, Input, OnInit } from '@angular/core';
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
      <app-document-table [documentos]="documentosAsociado || []"></app-document-table>
    </div>
    <div class="documentos-section">
      <h2>Ficha de riesgo del Asociado</h2>
      <app-document-table [documentos]="documentosRiesgo || []"></app-document-table>
    </div>
  </div>
  `,
  styleUrls: ['./prospecto-documentos.css'],
})
export class ProspectoDocumentos implements OnInit {
  @Input() documentosAsociado?: DocumentoData[];
  @Input() documentosRiesgo?: DocumentoData[];

  documentosAsociadoList: DocumentoData[] = [];
  documentosRiesgoList: DocumentoData[] = [];

  constructor(private prospectoApiService: ProspectoApiService) {}

  ngOnInit(): void {
    if (this.documentosAsociado) {
      this.documentosAsociadoList = this.documentosAsociado;
    }

    if (this.documentosRiesgo) {
      this.documentosRiesgoList = this.documentosRiesgo;
    }
  }
}
