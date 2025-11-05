import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProspectoTitular } from './prospecto-titular/prospecto-titular';
import { ProspectoInformacion } from './prospecto-informacion/prospecto-informacion';
import { ProspectoDocumentos } from './prospecto-documentos/prospecto-documentos';
import { ProspectoPaciente } from './prospecto-paciente/prospecto-paciente';
import { ProspectoAval } from './prospecto-aval/prospecto-aval';
import { ProspectoApiService, ProspectoRiesgoData, CreateProspectRiesgoRequest } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto',
  imports: [
    CommonModule,
    ProspectoTitular,
    ProspectoInformacion,
    ProspectoDocumentos,
    ProspectoPaciente,
    ProspectoAval,
  ],
  template: `
    <section class="section-container">
      @if (isLoading) {
        <div class="loading-container">
          <p>Cargando datos del prospecto...</p>
        </div>
      } @else {
        <app-prospecto-titular
          [initialData]="prospectoData?.titular"
          (dataSaved)="onTitularSaved($event)"
          (dataUpdated)="onTitularUpdated($event)">
        </app-prospecto-titular>

        <app-prospecto-paciente
          [initialData]="prospectoData?.paciente"
          (dataSaved)="onPacienteSaved($event)"
          (dataUpdated)="onPacienteUpdated($event)">
        </app-prospecto-paciente>

        <app-prospecto-aval
          [initialData]="prospectoData?.avalista"
          [documentos]="prospectoData?.documentos"
          (dataSaved)="onAvalistaSaved($event)"
          (dataUpdated)="onAvalistaUpdated($event)">
        </app-prospecto-aval>

        <app-prospecto-documentos
          [documentosAsociado]="prospectoData?.documentos"
          [documentosRiesgo]="documentosRiesgo">
        </app-prospecto-documentos>

        <div class="navigation-buttons containerBtn">
          <button
            type="button"
            class="btn-secondary"
            (click)="onDesaprobacionManual()"
            [disabled]="isProcessing">
            Desaprobacion manual
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="onAprobacionManual()"
            [disabled]="isProcessing">
            @if (isProcessing) { Procesando... } @else { Aprobacion manual }
          </button>
        </div>

        <app-prospecto-informacion
          [informacion]="prospectoData?.informacionProspecto">
        </app-prospecto-informacion>
      }
    </section>
  `,
  styleUrls: ['./prospecto.scss'],
})
export default class Prospecto implements OnInit, OnDestroy {
  prospectoData?: ProspectoRiesgoData;
  documentosRiesgo: any[] = [];
  isLoading = true;
  isProcessing = false;
  prospectoId?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private prospectoApiService: ProspectoApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get prospecto ID from route if available
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.prospectoId = params['id'];
        this.loadProspectoData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProspectoData() {
    this.isLoading = true;
    this.prospectoApiService.getProspectoRiesgoData(this.prospectoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.prospectoData = data;
          this.documentosRiesgo = data.documentos || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading prospecto data:', error);
          this.isLoading = false;
          alert('Error al cargar los datos del prospecto');
        }
      });
  }

  onTitularSaved(data: any) {
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.titular = data;
  }

  onTitularUpdated(data: any) {
    if (this.prospectoData) {
      this.prospectoData.titular = data;
    }
  }

  onPacienteSaved(data: any) {
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.paciente = data;
  }

  onPacienteUpdated(data: any) {
    if (this.prospectoData) {
      this.prospectoData.paciente = data;
    }
  }

  onAvalistaSaved(data: any) {
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.avalista = data;
  }

  onAvalistaUpdated(data: any) {
    if (this.prospectoData) {
      this.prospectoData.avalista = data;
    }
  }

  onAprobacionManual() {
    if (!this.prospectoData?.titular) {
      alert('Debe completar al menos la información del titular');
      return;
    }

    if (!confirm('¿Está seguro de aprobar este prospecto?')) {
      return;
    }

    this.isProcessing = true;
    const request: CreateProspectRiesgoRequest = {
      titular: this.prospectoData.titular!,
      paciente: this.prospectoData.paciente,
      avalista: this.prospectoData.avalista,
      documentos: this.prospectoData.documentos
    };

    this.prospectoApiService.createProspectRiesgo(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isProcessing = false;
          alert('Prospecto aprobado exitosamente');
          console.log('Prospecto approved:', response);
        },
        error: (error) => {
          this.isProcessing = false;
          console.error('Error approving prospect:', error);
          alert('Error al aprobar el prospecto');
        }
      });
  }

  onDesaprobacionManual() {
    if (!confirm('¿Está seguro de desaprobar este prospecto?')) {
      return;
    }

    // Implementar lógica de desaprobación manual
    alert('Funcionalidad de desaprobación manual en desarrollo');
  }
}
