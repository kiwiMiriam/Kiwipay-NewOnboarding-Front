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
            this.informacionMedica = {
              'Categoría médica': clinicalData.medicalCategoryId || clinicalData.categoriaMedica || '-',
              'Clínica': clinicalData.clinicId || clinicalData.clinica || '-',
              'Sede': clinicalData.branchId || clinicalData.sede || '-',
            };
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
}
