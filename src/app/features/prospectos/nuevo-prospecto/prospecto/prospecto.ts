import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProspectoInformacion } from './prospecto-informacion/prospecto-informacion';
import { ProspectoDocumentos } from './prospecto-documentos/prospecto-documentos';
import { ProspectoApiService, ProspectoRiesgoData, CreateProspectRiesgoRequest, ClienteData } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto',
  imports: [
    CommonModule,
    FormsModule,
    ProspectoInformacion,
    ProspectoDocumentos,
  ],
  template: `
    <section class="section-container">
      @if (isLoading) {
        <div class="loading-container">
          <p>Cargando datos del prospecto...</p>
        </div>
      } @else {
        <app-prospecto-documentos
          [clientId]="getClientId()"
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

        <!-- Modal de confirmación para aprobación manual -->
        <div class="modal-overlay" *ngIf="mostrarModalConfirmacion" (click)="cerrarModalConfirmacion()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Confirmar Aprobación Manual</h3>
            <p class="modal-message">
              ¿Está seguro de aprobar este prospecto? Esta acción no se puede deshacer.
            </p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="cerrarModalConfirmacion()">Cancelar</button>
              <button class="btn-primary" (click)="confirmarAprobacion()">Aceptar</button>
            </div>
          </div>
        </div>

        <app-prospecto-informacion
          [clientId]="getClientId()"
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
  mostrarModalConfirmacion = false;

  get documentosAsociado(): any[] {
    const docs = this.prospectoData?.documentos || [];
    return docs.map(d => ({ ...d, id: (d as any).id ?? '' }));
  }

  getClientId(): number | undefined {
    return this.prospectoId ? Number(this.prospectoId) : undefined;
  }

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
    if (!this.prospectoId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const clientId = Number(this.prospectoId);
    
    this.prospectoApiService.getProspectoRiesgoData(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Data loaded from backend:', data);
          // El endpoint devuelve ClienteData directamente, no ProspectoRiesgoData
          // Necesitamos estructurar correctamente los datos
          this.prospectoData = {
            titular: data,
            documentos: [],
            paciente: undefined,
            avalista: undefined
          };
          this.documentosRiesgo = [];
          this.isLoading = false;
          console.log('ProspectoData structured:', this.prospectoData);
        },
        error: (error) => {
          console.error('Error loading prospecto data:', error);
          this.isLoading = false;
          alert('Error al cargar los datos del prospecto');
        }
      });
  }

  onTitularSaved(data: any) {
    console.log('Titular saved, updating prospectoData:', data);
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.titular = data;
  }

  onTitularUpdated(data: any) {
    console.log('Titular updated, updating prospectoData:', data);
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
    // Validar datos obligatorios
    const validacion = this.validarDatosObligatorios();
    if (!validacion.esValido) {
      alert(validacion.mensaje);
      return;
    }

    // Mostrar modal de confirmación
    this.mostrarModalConfirmacion = true;
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
  }

  confirmarAprobacion(): void {
    this.mostrarModalConfirmacion = false;
    this.isProcessing = true;

    const request: CreateProspectRiesgoRequest = {
      titular: this.prospectoData!.titular!,
      paciente: this.prospectoData!.paciente,
      avalista: this.prospectoData!.avalista,
      documentos: this.prospectoData!.documentos
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

  private validarDatosObligatorios(): { esValido: boolean; mensaje: string } {
    if (!this.prospectoData?.titular) {
      return {
        esValido: false,
        mensaje: 'Debe completar la información del titular'
      };
    }

    const titular = this.prospectoData.titular;
    const camposRequeridosTitular: (keyof ClienteData)[] = [
      'documentType',
      'documentNumber',
      'firstNames',
      'lastNames',
      'maritalStatus',
      'birthDate',
      'gender',
      'email',
      'phone',
      'address',
    ];

    const camposFaltantes: string[] = [];
    for (const campo of camposRequeridosTitular) {
      const valor = titular[campo];
      if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
        camposFaltantes.push(campo);
      }
    }

    if (camposFaltantes.length > 0) {
      return {
        esValido: false,
        mensaje: `Debe completar todos los campos obligatorios del titular. Campos faltantes: ${camposFaltantes.join(', ')}`
      };
    }

    if (!this.prospectoData.documentos || this.prospectoData.documentos.length === 0) {
      return {
        esValido: false,
        mensaje: 'Debe tener al menos un documento del asociado cargado'
      };
    }

    if (!this.documentosRiesgo || this.documentosRiesgo.length === 0) {
      return {
        esValido: false,
        mensaje: 'Debe tener al menos un documento de ficha de riesgo del asociado cargado'
      };
    }

    return { esValido: true, mensaje: '' };
  }

  onDesaprobacionManual() {
    if (!confirm('¿Está seguro de desaprobar este prospecto?')) {
      return;
    }

    alert('Funcionalidad de desaprobación manual en desarrollo');
  }
}
