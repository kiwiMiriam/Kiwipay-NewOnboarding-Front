import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { InformacionProspecto, ProspectoApiService, PacienteData, ClinicalData } from '@app/core/services/prospecto-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-prospecto-informacion',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="section-container">
    <div class="info-container">
      <h3>Informacion del paciente</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionPersonal | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Informacion del prestamo</h3>
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
      <h3>Informacion médica</h3>
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

  informacionPersonal: any = {};
  informacionPrestamo: any = {};
  informacionMedica: any = {};
  
  private destroy$ = new Subject<void>();

  constructor(private prospectoApiService: ProspectoApiService) {}

  ngOnInit(): void {
    if (this.clientId) {
      this.loadPatientData();
      this.loadClinicalData();
    }
    
    // Mantener la lógica de informacion del prestamo si viene del @Input
    if (this.informacion) {
      this.informacionPrestamo = this.informacion.informacionPrestamo || {};
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos del paciente desde el endpoint GET /api/v1/clients/{clientId}/patients
   */
  private loadPatientData(): void {
    if (!this.clientId) return;

    this.prospectoApiService.getPatients(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients: PacienteData[]) => {
          // Usar siempre el primer elemento del array
          const patient = patients && patients.length > 0 ? patients[0] : null;
          
          if (patient) {
            this.informacionPersonal = {
              'Nombres': patient.firstNames || patient.nombres || '-',
              'Apellidos': patient.lastNames || patient.apellidos || '-',
              'Documento de identidad': patient.documentNumber || patient.numeroDocumento || '-',
              'Teléfono celular': patient.phone || patient.telefono || '-',
              'Correo electrónico': patient.email || patient.correo || '-',
              'Género': patient.gender || patient.sexo || '-',
              'Calificación Experian': patient.experianRating || patient.calificacionExperian || '-',
              'Edad': patient.age || patient.edad || '-',
              'Fecha de nacimiento': patient.birthDate || patient.fechaNacimiento || '-',
              'Grupo': patient.group || patient.grupo || '-',
              'Ingresos mensuales': patient.monthlyIncome || patient.ingresosMensuales || '-',
              'Respuesta Experian': patient.experianResponse || patient.respuestaExperian || '-',
              'Resultado Experian': patient.experianResult || patient.resultadoExperian || '-',
              'Score Experian': patient.experianScore || patient.scoreExperian || '-',
              'Segmento': patient.segment || patient.segmento || '-'
            };
          } else {
            // Si no hay paciente, mostrar valores vacíos
            this.informacionPersonal = {
              'Nombres': '-',
              'Apellidos': '-',
              'Documento de identidad': '-',
              'Teléfono celular': '-',
              'Correo electrónico': '-',
              'Género': '-',
            };
          }
        },
        error: (error) => {
          console.error('Error loading patient data:', error);
          // En caso de error, mostrar valores vacíos
          this.informacionPersonal = {
            'Nombres': '-',
            'Apellidos': '-',
            'Documento de identidad': '-',
            'Teléfono celular': '-',
            'Correo electrónico': '-',
            'Género': '-',
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
}
