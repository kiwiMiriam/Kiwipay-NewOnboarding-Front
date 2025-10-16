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
import { ProspectosService } from '../../core/services/prospectos.service';
import { ProspectoResponse, ProspectoFilter } from '../../core/models/prospecto.model';

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  template: `
    <div class="bandeja-container">
      <header class="page-header">
        <h1 class="page-title">Bandeja de Prospectos</h1>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="nuevoProspecto()">
            <fa-icon [icon]="faPlus"></fa-icon>
            Nuevo Prospecto
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
        <table class="table">
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
              <td>{{ prospecto.contrato }}</td>
              <td>
                <span class="estado-badge" [class]="'estado-' + prospecto.estado.toLowerCase()">
                  {{ prospecto.estado }}
                </span>
              </td>
              <td>{{ prospecto.documento }}</td>
              <td>{{ prospecto.asociado }}</td>
              <td>{{ prospecto.programa }}</td>
              <td>{{ prospecto.grupo }}</td>
              <td>{{ prospecto.ciudad }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-icon btn-edit" (click)="editarProspecto(prospecto.id)" title="Editar">
                    <fa-icon [icon]="faEdit"></fa-icon>
                  </button>
                  <button class="btn btn-icon btn-delete" (click)="eliminarProspecto(prospecto.id)" title="Eliminar">
                    <fa-icon [icon]="faTrash"></fa-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

    .table {
      width: 100%;
      border-collapse: collapse;
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
    }

    .estado-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .estado-pendiente {
      background-color: #fef3c7;
      color: #92400e;
    }

    .estado-en-proceso {
      background-color: #e0f2fe;
      color: #0369a1;
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
  `]
})
export class BandejaComponent implements OnInit {
  prospectos: ProspectoResponse[] = [];
  filterForm: FormGroup;

  // Font Awesome icons
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faSearch = faSearch;
  faDownload = faDownload;

  constructor(
    private prospectosService: ProspectosService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
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
    this.loadProspectos();
  }

  loadProspectos(filter?: ProspectoFilter) {
    this.prospectosService.getProspectos(filter).subscribe(
      prospectos => this.prospectos = prospectos
    );
  }

  applyFilters() {
    const filters = this.filterForm.value;
    this.loadProspectos(filters);
  }

  limpiarFiltros() {
    this.filterForm.reset();
    this.loadProspectos();
  }

  nuevoProspecto() {
    this.prospectosService.setSelectedProspecto(null);
    this.router.navigate(['/dashboard/nuevo-prospecto/datos-cliente']);
  }

  editarProspecto(id: string) {
    this.prospectosService.getProspectoById(id).subscribe(prospecto => {
      if (prospecto) {
        this.prospectosService.setSelectedProspecto(prospecto);
        this.router.navigate(['/dashboard/nuevo-prospecto/datos-cliente']);
      }
    });
  }

  eliminarProspecto(id: string) {
    if (confirm('¿Está seguro de eliminar este prospecto?')) {
      this.prospectosService.deleteProspecto(id).subscribe(
        success => {
          if (success) {
            this.loadProspectos(this.filterForm.value);
          }
        }
      );
    }
  }

  exportarExcel() {
    // Implementar la exportación a Excel
    console.log('Exportar a Excel - Función por implementar');
  }
}
