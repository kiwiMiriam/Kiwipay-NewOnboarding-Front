import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InformacionProspecto, ProspectoApiService, PacienteData, ClinicalData, ClienteData, GuarantorSpouseData } from '@app/core/services/prospecto-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-prospecto-informacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="section-container">
    
    <div class="info-container">
      <h3>Información del Titular</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionTitular | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value" *ngIf="item.key !== 'Ingresos mensuales'">{{item.value || '-'}}</td>
            <td class="value" *ngIf="item.key === 'Ingresos mensuales'">
              <div class="editable-field">
                <input type="number" [(ngModel)]="ingresosMensualesEdit" [placeholder]="item.value || 'Ingrese monto'" min="0" step="100">
                <button type="button" class="btn-save" (click)="guardarIngresos()">Guardar ingresos</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Información del Cónyuge del Titular</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionConyugeTitular | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Información del Aval</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionAval | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Información del Cónyuge del Aval</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionConyugeAval | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Información del Préstamo</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionPrestamo | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Información Médica</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionMedica | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styleUrl: './prospecto-informacion.scss',
})
export class ProspectoInformacion implements OnInit, OnDestroy {
  @Input() informacion?: InformacionProspecto;
  @Input() clientId?: number;

  informacionTitular: any = {};
  informacionConyugeTitular: any = {};
  informacionAval: any = {};
  informacionConyugeAval: any = {};
  informacionPrestamo: any = {};
  informacionMedica: any = {};
  ingresosMensualesEdit: number = 0;
  
  // Control de estado del cliente
  clientStatus: string = '';
  allowedActions: string[] = [];
  isExecutingAction = false;
  
  private destroy$ = new Subject<void>();

  constructor(private prospectoApiService: ProspectoApiService) {}

  ngOnInit(): void {
    if (this.clientId) {
      this.loadClientData();
      this.loadTitularData();
      this.loadConyugeTitularData();
      this.loadAvalData();
      this.loadConyugeAvalData();
      this.loadClinicalData();
    }
    
    this.initializeLoanData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos del cliente para obtener estado y acciones permitidas
   */
  private loadClientData(): void {
    if (!this.clientId) return;
    
    console.log('=== CARGANDO DATOS DEL CLIENTE RIESGOS ===');
    console.log('Client ID:', this.clientId);
    
    this.prospectoApiService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client) => {
          console.log('Datos del cliente cargados (RIESGOS):', client);
          this.clientStatus = client.status || '';
          this.allowedActions = client.allowedActions || [];
          
          console.log('Estado del cliente (RIESGOS):', this.clientStatus);
          console.log('Acciones permitidas (RIESGOS):', this.allowedActions);
        },
        error: (error) => {
          console.error('Error cargando datos del cliente (RIESGOS):', error);
          this.clientStatus = '';
          this.allowedActions = [];
        }
      });
  }

  /**
   * Refrescar datos del cliente después de una acción
   */
  private refreshClientData(): void {
    if (this.clientId) {
      this.loadClientData();
    }
  }

  isActionAllowed(action: string): boolean {
    return this.allowedActions.includes(action);
  }

  getStatusDisplayText(): string {
    return this.prospectoApiService.mapStatusToDisplayText(this.clientStatus);
  }

  /**
   * Cargar datos del titular desde el endpoint GET /api/v1/clients/{id}
   */
  private loadTitularData(): void {
    if (!this.clientId) return;

    this.prospectoApiService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (titular: ClienteData) => {
          if (titular) {
            this.informacionTitular = {
              'Tipo de documento': titular.documentType || titular.tipoDocumento || '-',
              'Número de documento': titular.documentNumber || titular.numeroDocumento || '-',
              'Nombres': titular.firstNames || titular.nombres || '-',
              'Apellidos': titular.lastNames || titular.apellidos || '-',
              'Estado civil': titular.maritalStatus || titular.estadoCivil || '-',
              'Fecha de nacimiento': titular.birthDate || titular.fechaNacimiento || '-',
              'Sexo': titular.gender || titular.sexo || '-',
              'Correo electrónico': titular.email || titular.correo || '-',
              'Teléfono': titular.phone || titular.telefono || '-',
              'Departamento': titular.address?.departmentId || titular.departamento || '-',
              'Provincia': titular.address?.provinceId || titular.provincia || '-',
              'Distrito': titular.address?.districtId || titular.distrito || '-',
              'Dirección': titular.address?.line1 || titular.direccion || '-',
              'Calificación Experian': '-',
              'Edad': '-',
              'Grupo': '-',
              'Ingresos mensuales': '-',
              'Respuesta Experian': '-',
              'Resultado Experian': '-',
              'Score Experian': '-',
              'Segmento': '-'
            };
          } else {
            // Si no hay titular, mostrar valores vacíos
            this.informacionTitular = {
              'Tipo de documento': '-',
              'Número de documento': '-',
              'Nombres': '-',
              'Apellidos': '-',
              'Estado civil': '-',
              'Fecha de nacimiento': '-',
              'Sexo': '-',
              'Correo electrónico': '-',
              'Teléfono': '-',
              'Departamento': '-',
              'Provincia': '-',
              'Distrito': '-',
              'Dirección': '-',
              'Calificación Experian': '-',
              'Edad': '-',
              'Grupo': '-',
              'Ingresos mensuales': '-',
              'Respuesta Experian': '-',
              'Resultado Experian': '-',
              'Score Experian': '-',
              'Segmento': '-'
            };
          }
        },
        error: (error) => {
          console.error('Error loading titular data:', error);
          // En caso de error, mostrar valores vacíos
          this.informacionTitular = {
            'Tipo de documento': '-',
            'Número de documento': '-',
            'Nombres': '-',
            'Apellidos': '-',
            'Estado civil': '-',
            'Fecha de nacimiento': '-',
            'Sexo': '-',
            'Correo electrónico': '-',
            'Teléfono': '-',
            'Departamento': '-',
            'Provincia': '-',
            'Distrito': '-',
            'Dirección': '-',
            'Calificación Experian': '-',
            'Edad': '-',
            'Grupo': '-',
            'Ingresos mensuales': '-',
            'Respuesta Experian': '-',
            'Resultado Experian': '-',
            'Score Experian': '-',
            'Segmento': '-'
          };
        }
      });
  }

  /**
   * Cargar datos clínicos desde el endpoint GET /api/v1/clients/{clientId}/clinical-data
   */
  private loadClinicalData(): void {
    if (!this.clientId) return;

    this.prospectoApiService.getClinicalData(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clinicalData: ClinicalData | null) => {
          if (clinicalData) {
            // Inicializar con los IDs mientras se cargan los nombres
            this.informacionMedica = {
              'Categoría médica': clinicalData.medicalCategoryId || clinicalData.categoriaMedica || '-',
              'Clínica': clinicalData.clinicId || clinicalData.clinica || '-',
              'Sede': clinicalData.branchId || clinicalData.sede || '-',
            };

            // Cargar el nombre de la categoría médica
            if (clinicalData.medicalCategoryId || clinicalData.categoriaMedica) {
              this.loadMedicalCategoryName(clinicalData.medicalCategoryId || clinicalData.categoriaMedica || '');
            }

            // Cargar el nombre de la clínica
            if (clinicalData.clinicId || clinicalData.clinica) {
              this.loadClinicName(
                clinicalData.medicalCategoryId || clinicalData.categoriaMedica || '',
                clinicalData.clinicId || clinicalData.clinica || ''
              );
            }

            // Cargar el nombre de la sede
            if (clinicalData.branchId || clinicalData.sede) {
              this.loadBranchName(
                clinicalData.clinicId || clinicalData.clinica || '',
                clinicalData.branchId || clinicalData.sede || ''
              );
            }
          } else {
            // Si no hay datos clínicos, mostrar valores vacíos
            this.informacionMedica = {
              'Categoría médica': '-',
              'Clínica': '-',
              'Sede': '-',
            };
          }
        },
        error: (error) => {
          console.error('Error loading clinical data:', error);
          // En caso de error, mostrar valores vacíos
          this.informacionMedica = {
            'Categoría médica': '-',
            'Clínica': '-',
            'Sede': '-',
          };
        }
      });
  }

  /**
   * Cargar el nombre de la categoría médica por su ID
   */
  private loadMedicalCategoryName(categoryId: string): void {
    this.prospectoApiService.getMedicalCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            this.informacionMedica['Categoría médica'] = category.name;
          }
        },
        error: (error) => {
          console.error('Error loading medical category name:', error);
        }
      });
  }

  /**
   * Cargar el nombre de la clínica por su ID
   */
  private loadClinicName(categoryId: string, clinicId: string): void {
    this.prospectoApiService.getClinicsByCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clinics) => {
          const clinic = clinics.find(c => c.id === clinicId);
          if (clinic) {
            this.informacionMedica['Clínica'] = clinic.name;
          }
        },
        error: (error) => {
          console.error('Error loading clinic name:', error);
        }
      });
  }

  /**
   * Cargar el nombre de la sede por su ID
   */
  private loadBranchName(clinicId: string, branchId: string): void {
    this.prospectoApiService.getBranchesByClinic(clinicId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (branches) => {
          const branch = branches.find(b => b.id === branchId);
          if (branch) {
            this.informacionMedica['Sede'] = branch.name;
          }
        },
        error: (error) => {
          console.error('Error loading branch name:', error);
        }
      });
  }

  /**
   * Cargar datos del cónyuge del titular
   */
  private loadConyugeTitularData(): void {
    if (!this.clientId) return;

    this.prospectoApiService.getSpouse(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conyuge) => {
          if (conyuge) {
            this.informacionConyugeTitular = {
              'Tipo de documento': conyuge.documentType || conyuge.tipoDocumento || '-',
              'Número de documento': conyuge.documentNumber || conyuge.numeroDocumento || '-',
              'Nombres': conyuge.firstNames || conyuge.nombres || '-',
              'Apellidos': conyuge.lastNames || conyuge.apellidos || '-',
              'Correo electrónico': conyuge.email || conyuge.correo || '-',
              'Teléfono': conyuge.phone || conyuge.telefono || '-'
            };
          } else {
            this.initializeEmptyConyugeTitular();
          }
        },
        error: (error) => {
          console.error('Error loading cónyuge titular data:', error);
          this.initializeEmptyConyugeTitular();
        }
      });
  }

  /**
   * Cargar datos del aval
   */
  private loadAvalData(): void {
    if (!this.clientId) return;

    this.prospectoApiService.getGuarantor(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aval) => {
          if (aval) {
            this.informacionAval = {
              'Tipo de documento': aval.documentType || aval.tipoDocumento || '-',
              'Número de documento': aval.documentNumber || aval.numeroDocumento || '-',
              'Nombres': aval.firstNames || aval.nombres || '-',
              'Apellidos': aval.lastNames || aval.apellidos || '-',
              'Estado civil': aval.maritalStatus || aval.estadoCivil || '-',
              'Sexo': aval.gender || aval.sexo || '-',
              'Correo electrónico': aval.email || aval.correo || '-',
              'Teléfono': aval.phone || aval.telefono || '-',
              'Ingresos': aval.ingresos || '-',
              'Departamento': aval.address?.departmentId || aval.departamento || '-',
              'Provincia': aval.address?.provinceId || aval.provincia || '-',
              'Distrito': aval.address?.districtId || aval.distrito || '-',
              'Dirección': aval.address?.line1 || aval.direccion || '-'
            };
          } else {
            this.initializeEmptyAval();
          }
        },
        error: (error) => {
          console.error('Error loading aval data:', error);
          this.initializeEmptyAval();
        }
      });
  }

  /**
   * Cargar datos del cónyuge del aval
   */
  private loadConyugeAvalData(): void {
    if (!this.clientId) return;

    console.log('=== CARGANDO CÓNYUGE DEL AVAL ===');
    console.log('Client ID:', this.clientId);

    // Primero verificar si existe el aval, luego cargar su cónyuge
    this.prospectoApiService.getGuarantor(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (aval) => {
          console.log('Aval encontrado:', aval);
          if (aval && (aval.guarantorId || aval.id)) {
            // Usar guarantorId si está disponible, sino usar id
            const guarantorId = aval.guarantorId || aval.id;
            console.log('Guarantor ID para buscar cónyuge:', guarantorId);
            console.log('Tipo del guarantorId:', typeof guarantorId);
            // Verificar que guarantorId no sea undefined
            if (guarantorId) {
              // No convertir a Number, el guarantorId es un string como "GUA-002"
              this.loadGuarantorSpouse(guarantorId);
            } else {
              console.log('Guarantor ID es undefined');
              this.initializeEmptyConyugeAval();
            }
          } else {
            console.log('No se encontró aval o no tiene ID');
            this.initializeEmptyConyugeAval();
          }
        },
        error: (error) => {
          console.error('Error checking for aval:', error);
          this.initializeEmptyConyugeAval();
        }
      });
  }

  /**
   * Cargar cónyuge del aval usando el endpoint GET /api/v1/guarantors/{guarantorId}/spouse
   */
  private loadGuarantorSpouse(guarantorId: string | number): void {
    console.log('=== CARGANDO CÓNYUGE DEL AVAL ===');
    console.log('Guarantor ID recibido:', guarantorId);
    console.log('Tipo del guarantorId:', typeof guarantorId);
    console.log('URL que se va a llamar:', `http://localhost:8080/api/v1/guarantors/${guarantorId}/spouse`);
    
    this.prospectoApiService.getGuarantorSpouse(guarantorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conyugeAval: GuarantorSpouseData | null) => {
          console.log('Respuesta del endpoint cónyuge del aval:', conyugeAval);
          if (conyugeAval) {
            this.informacionConyugeAval = {
              'Tipo de documento': conyugeAval.documentType || '-',
              'Número de documento': conyugeAval.documentNumber || '-',
              'Nombres': conyugeAval.firstNames || '-',
              'Apellidos': conyugeAval.lastNames || '-',
              'Correo electrónico': conyugeAval.email || '-',
              'Teléfono': conyugeAval.phone || '-'
            };
            console.log('Cónyuge del aval cargado exitosamente:', this.informacionConyugeAval);
          } else {
            console.log('No se encontró cónyuge para el guarantor ID:', guarantorId);
            this.initializeEmptyConyugeAval();
          }
        },
        error: (error) => {
          console.error('=== ERROR AL CARGAR CÓNYUGE DEL AVAL ===');
          console.error('Guarantor ID:', guarantorId);
          console.error('URL llamada:', `http://localhost:8080/api/v1/guarantors/${guarantorId}/spouse`);
          console.error('Error completo:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          this.initializeEmptyConyugeAval();
        }
      });
  }

  /**
   * Inicializar información del préstamo con campos hardcodeados
   */
  private initializeLoanData(): void {
    this.informacionPrestamo = {
      'Campaña': '-',
      'Cuota mensual': '-',
      'Estado del préstamo': '-',
      'Fecha de solicitud': '-',
      'Número de cuotas': '-',
      'Préstamo solicitado': '-'
    };
  }

  /**
   * Inicializar información vacía del cónyuge del titular
   */
  private initializeEmptyConyugeTitular(): void {
    this.informacionConyugeTitular = {
      'Tipo de documento': '-',
      'Número de documento': '-',
      'Nombres': '-',
      'Apellidos': '-',
      'Correo electrónico': '-',
      'Teléfono': '-'
    };
  }

  /**
   * Inicializar información vacía del aval
   */
  private initializeEmptyAval(): void {
    this.informacionAval = {
      'Tipo de documento': '-',
      'Número de documento': '-',
      'Nombres': '-',
      'Apellidos': '-',
      'Estado civil': '-',
      'Sexo': '-',
      'Correo electrónico': '-',
      'Teléfono': '-',
      'Ingresos': '-',
      'Departamento': '-',
      'Provincia': '-',
      'Distrito': '-',
      'Dirección': '-'
    };
  }

  /**
   * Inicializar información vacía del cónyuge del aval
   */
  private initializeEmptyConyugeAval(): void {
    this.informacionConyugeAval = {
      'Tipo de documento': '-',
      'Número de documento': '-',
      'Nombres': '-',
      'Apellidos': '-',
      'Correo electrónico': '-',
      'Teléfono': '-'
    };
  }

  /**
   * Guardar ingresos mensuales del titular
   */
  guardarIngresos(): void {
    if (this.ingresosMensualesEdit && this.ingresosMensualesEdit > 0) {
      // Actualizar el valor mostrado en la tabla
      this.informacionTitular['Ingresos mensuales'] = this.ingresosMensualesEdit;
      
      // Mostrar confirmación visual
      console.log('Ingresos actualizados:', this.ingresosMensualesEdit);
      
      // TODO: Aquí se implementará la llamada al endpoint cuando esté disponible
      // this.prospectoApiService.updateClientIncome(this.clientId, this.ingresosMensualesEdit)
    }
  }
}
