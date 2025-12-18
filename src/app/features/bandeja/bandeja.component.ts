import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { ProspectosService, Prospecto } from '../../core/services/prospectos.service';
import { ProspectoFilter } from '../../core/models/prospecto.model';
import { ProspectoApiService } from '@src/app/core/services/prospecto-api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  template: `
    <div class="bandeja-container">
      <header class="page-header">
        <h1 class="page-title">Bandeja de Prospectos</h1>
        <div class="header-actions">
          <button class="btn btn-primary" 
                  (click)="nuevoProspecto()" 
                  [disabled]="isProcessing">
            <fa-icon [icon]="faPlus"></fa-icon>
            {{ isProcessing ? 'Procesando...' : 'Nuevo Prospecto' }}
          </button>
          <button class="btn btn-secondary" (click)="exportarExcel()">
            <fa-icon [icon]="faDownload"></fa-icon>
            Exportar Excel
          </button>
        </div>
      </header>

      <div class="filters-section">
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()">
          <div class="filter-grid">
            <div class="form-group">
              <label for="contrato">Nro. de Contrato</label>
              <input type="text" id="contrato" formControlName="contrato" class="form-control">
            </div>
            <div class="form-group">
              <label for="documento">Nro. de Documento</label>
              <input type="text" id="documento" formControlName="documento" class="form-control">
            </div>
            <div class="form-group">
              <label for="asociado">Asociado</label>
              <input type="text" id="asociado" formControlName="asociado" class="form-control">
            </div>
            <div class="form-group">
              <label for="programa">Programa</label>
              <input type="text" id="programa" formControlName="programa" class="form-control">
            </div>
            <div class="form-group">
              <label for="grupo">Grupo</label>
              <input type="text" id="grupo" formControlName="grupo" class="form-control">
            </div>
            <div class="form-group">
              <label for="fechaInicio">Fecha Inicio</label>
              <input type="date" id="fechaInicio" formControlName="fechaInicio" class="form-control">
            </div>
            <div class="form-group">
              <label for="fechaFin">Fecha Fin</label>
              <input type="date" id="fechaFin" formControlName="fechaFin" class="form-control">
            </div>
            <div class="form-group button-group">
              <button type="submit" class="btn btn-primary">
                <fa-icon [icon]="faSearch"></fa-icon>
                Buscar
              </button>
              <button type="button" class="btn btn-secondary" (click)="limpiarFiltros()">
                Limpiar
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="table-container">
        <div *ngIf="loading" class="loading-indicator">
          <p>Cargando datos...</p>
        </div>
        <div class="table-responsive">
          <table class="table" *ngIf="!loading">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Estado</th>
                <th>Documento</th>
                <th>Asociado</th>
                <th>Programa</th>
                <th>Grupo</th>
                <th>Ciudad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prospecto of prospectos">
                <td data-label="Contrato">{{ prospecto.contrato || '-' }}</td>
                <td data-label="Estado">
                  <span class="estado-badge"
                        [class]="'estado-badge ' + getStatusClass(prospecto.status)">
                    {{ mapStatusToDisplayText(prospecto.status) }}
                  </span>
                </td>
                <td data-label="Documento">{{ prospecto.documento || '-' }}</td>
                <td data-label="Asociado">{{ prospecto.asociado || '-' }}</td>
                <td data-label="Programa">{{ prospecto.programa || '-' }}</td>
                <td data-label="Grupo">{{ prospecto.grupo || '-' }}</td>
                <td data-label="Ciudad">{{ prospecto.ciudad || '-' }}</td>
                <td data-label="Acciones">
                  <div class="action-buttons">
                    <button class="btn btn-icon btn-edit" 
                            (click)="editarProspecto(prospecto.id)" 
                            [disabled]="isProcessing"
                            title="Editar">
                      <fa-icon [icon]="faEdit"></fa-icon>
                    </button>
                    <button class="btn btn-icon btn-delete" 
                            (click)="eliminarProspecto(prospecto.id)" 
                            [disabled]="isProcessing"
                            title="Eliminar">
                      <fa-icon [icon]="faTrash"></fa-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && prospectos.length === 0">
                <td colspan="8" style="text-align: center; padding: 2rem;">
                  No se encontraron registros
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bandeja-container {
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .filters-section {
      background-color: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      color: #4a5568;
    }

    .form-control {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      align-self: end;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #4CAF50;
      color: white;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-primary:hover {
      background-color: #43a047;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .table-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }

    .table th,
    .table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #4a5568;
      white-space: nowrap;
    }

    .table td {
      vertical-align: middle;
    }

    .estado-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .estado-manual {
      background-color: #f1f5f9;
      color: #475569;
    }

    .estado-documentos-completados {
      background-color: #e0f2fe;
      color: #0369a1;
    }

    .estado-aprobado-adv {
      background-color: #cffafe;
      color: #0891b2;
    }

    .estado-observado-adv {
      background-color: #fef3c7;
      color: #92400e;
    }

    .estado-aprobado-riesgos {
      background-color: #dcfce7;
      color: #166534;
    }

    .estado-rechazado-riesgos {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .estado-observado-riesgos {
      background-color: #fef3c7;
      color: #d97706;
    }

    .estado-credito-pre-aprobado {
      background-color: #dcfce7;
      color: #166534;
    }

    .estado-credito-rechazado {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .estado-desconocido {
      background-color: #f8fafc;
      color: #64748b;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .filter-grid {
        grid-template-columns: 1fr;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .table {
        min-width: 600px;
        font-size: 0.875rem;
      }

      .table th,
      .table td {
        padding: 0.75rem 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .bandeja-container {
        padding: 10px;
      }

      .table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
      }

      .table thead,
      .table tbody,
      .table th,
      .table td,
      .table tr {
        display: block;
      }

      .table thead tr {
        position: absolute;
        top: -9999px;
        left: -9999px;
      }

      .table tr {
        border: 1px solid #ccc;
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 4px;
        background-color: white;
      }

      .table td {
        border: none;
        position: relative;
        padding-left: 50% !important;
        white-space: normal;
        text-align: right;
      }

      .table td:before {
        content: attr(data-label) ": ";
        position: absolute;
        left: 6px;
        width: 45%;
        text-align: left;
        font-weight: bold;
        color: #4a5568;
      }

      .action-buttons {
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .btn-icon {
      padding: 0.25rem;
      border-radius: 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: #4a5568;
      transition: color 0.2s;
    }

    .btn-edit:hover {
      color: #3b82f6;
    }

    .btn-delete:hover {
      color: #ef4444;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .loading-indicator {
      padding: 2rem;
      text-align: center;
      color: #6c757d;
    }
  `]
})
export class BandejaComponent implements OnInit {
  prospectos: Prospecto[] = [];
  filterForm: FormGroup;
  loading = false;
  isProcessing = false;

  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faSearch = faSearch;
  faDownload = faDownload;

  constructor(
    private prospectosService: ProspectosService,
    private prospectoApiService: ProspectoApiService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      contrato: [''],
      documento: [''],
      asociado: [''],
      programa: [''],
      grupo: [''],
      fechaInicio: [''],
      fechaFin: ['']
    });
  }

  ngOnInit() {
    // Limpiar el prospecto seleccionado cuando llegamos a la bandeja
    this.prospectosService.setSelectedProspecto(null);
    this.loadProspectos();
  }

  /**
   * Mapear el estado del backend a texto visible para el usuario
   */
  mapStatusToDisplayText(status: string): string {
    return this.prospectoApiService.mapStatusToDisplayText(status);
  }

  /**
   * Obtener clase CSS para el estado
   */
  getStatusClass(status: string): string {
    switch(status) {
      case 'MANUAL':
        return 'estado-manual';
      case 'DOCUMENTOS_COMPLETADOS':
        return 'estado-documentos-completados';
      case 'APROBADO_POR_ADV':
        return 'estado-aprobado-adv';
      case 'OBSERVADO_POR_ADV':
        return 'estado-observado-adv';
      case 'APROBADO_POR_RIESGOS':
        return 'estado-aprobado-riesgos';
      case 'RECHAZO_POR_RIESGOS':
        return 'estado-rechazado-riesgos';
      case 'OBSERVADO_POR_RIESGOS':
        return 'estado-observado-riesgos';
      case 'CREDITO_PRE_APROBADO':
        return 'estado-credito-pre-aprobado';
      case 'CREDITO_RECHAZADO':
        return 'estado-credito-rechazado';
      default:
        return 'estado-desconocido';
    }
  }

  loadProspectos(filter?: ProspectoFilter) {
    this.loading = true;
    // Primero cargar datos del backend
    this.prospectosService.fetchAllClients();
    
    // Luego obtener los datos procesados
    this.prospectosService.getProspectos(filter).subscribe({
      next: (prospectos) => {
        this.prospectos = prospectos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando prospectos:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    this.loadProspectos(filters);
  }

  limpiarFiltros() {
    this.filterForm.reset();
    this.loadProspectos();
  }

  /**
   * Refrescar un prospecto específico después de una acción
   */
  refreshProspecto(prospectoId: string) {
    // Recargar toda la lista para obtener estados actualizados
    this.loadProspectos(this.filterForm.value);
  }

  nuevoProspecto() {
    // Prevenir múltiples ejecuciones
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // Navegar al formulario de creación SIN query parameters
    this.router.navigate(['/dashboard/nuevo-prospecto/datos-cliente']).finally(() => {
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        this.isProcessing = false;
      }, 1000);
    });
  }

  editarProspecto(id: string) {
    // Prevenir múltiples ejecuciones
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    // Obtener la ruta permitida según el rol del usuario
    const allowedRoute = this.authService.getFirstAllowedRoute();
    
    // Navegar al formulario de edición con el ID como query parameter
    this.router.navigate([allowedRoute], {
      queryParams: { id: id }
    }).finally(() => {
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        this.isProcessing = false;
      }, 1000);
    });
  }

  eliminarProspecto(id: string) {
  if (confirm('¿Está seguro de eliminar este prospecto?')) {
    this.prospectoApiService.deleteClient(Number(id)).subscribe({
      next: () => {
        alert('Prospecto eliminado exitosamente');
        this.loadProspectos(this.filterForm.value);
      },
      error: (err: any) => {
        alert('Error al eliminar prospecto');
        console.error(err);
      }
    });
  }}

  exportarExcel() {
    // Implementar la exportación a Excel
    console.log('Exportar a Excel - Función por implementar');
  }
}
