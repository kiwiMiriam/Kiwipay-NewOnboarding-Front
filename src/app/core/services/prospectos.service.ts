import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ProspectoFilter } from '../models/prospecto.model';
import { HttpClient } from '@angular/common/http';

export interface Prospecto {
  id: string;
  contrato: string;
  estado: string;
  documento: string;
  asociado: string;
  programa: string;
  grupo: string;
  ciudad: string;
    // Otros campos de la bandeja,
    //  si el backend no los envía, quedan en blanco
  // Add all the datos-cliente fields
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  estadoCivil?: string;
  fechaNacimiento?: string;
  sexo?: string;
  correo?: string;
  telefono?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  // Paciente info
  paciente?: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombres?: string;
    apellidos?: string;
    sexo?: string;
    telefono?: string;
    correo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    direccion?: string;
  };
  // Avalista info
  avalista?: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombres?: string;
    apellidos?: string;
    estadoCivil?: string;
    telefono?: string;
    ingresos?: string;
  };
  // Conyugue info
  conyugue?: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombres?: string;
    apellidos?: string;
    correo?: string;
    telefono?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProspectosService {
  private prospectos = new BehaviorSubject<Prospecto[]>([]);
  prospectos$ = this.prospectos.asObservable();
  constructor(private http: HttpClient) {}

  // For selected prospecto details
  private selectedProspectoSubject = new BehaviorSubject<Prospecto | null>(null);
  selectedProspecto$ = this.selectedProspectoSubject.asObservable();

  fetchAllClients(): void {
    this.http.get<any[]>(`http://localhost:8080/api/v1/clients`).subscribe({
      next: (clients) => {
        const mapped = clients.map(c => ({
          id: c.id?.toString() ?? '',
          contrato: '', // No viene del backend - se mantiene vacío
          estado: '',   // No viene del backend - se mantiene vacío
          documento: `${c.documentType ?? ''}-${c.documentNumber ?? ''}`,
          asociado: `${c.firstNames ?? ''} ${c.lastNames ?? ''}`.trim() || '', // Concatenamos nombres y apellidos
          programa: '', // No viene del backend - se mantiene vacío
          grupo: '',    // No viene del backend - se mantiene vacío
          ciudad: '',   // No viene del backend - se mantiene vacío
          tipoDocumento: c.documentType ?? '',
          numeroDocumento: c.documentNumber ?? '',
          nombres: c.firstNames ?? '',
          apellidos: c.lastNames ?? '',
          estadoCivil: c.maritalStatus ?? '',
          fechaNacimiento: c.birthDate ?? '',
          sexo: c.gender ?? '',
          correo: c.email ?? '',
          telefono: c.phone ?? '',
          departamento: c.address?.departmentId ?? '',
          provincia: c.address?.provinceId ?? '',
          distrito: c.address?.districtId ?? '',
          direccion: c.address?.line1 ?? '',
          paciente: undefined,
          avalista: undefined,
          conyugue: undefined
        }));
        this.prospectos.next(mapped);
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
        this.prospectos.next([]);
      }
    });
  }
  
  getProspectos(filter?: ProspectoFilter): Observable<Prospecto[]> {
    return this.prospectos.asObservable().pipe(
      map(prospectos => {
        if (!filter) return prospectos;

        return prospectos.filter(p => {
          let matches = true;
          if (filter.contrato) {
            matches = matches && p.contrato.toLowerCase().includes(filter.contrato.toLowerCase());
          }
          if (filter.documento) {
            matches = matches && p.documento.toLowerCase().includes(filter.documento.toLowerCase());
          }
          if (filter.asociado) {
            matches = matches && p.asociado.toLowerCase().includes(filter.asociado.toLowerCase());
          }
          if (filter.programa) {
            matches = matches && p.programa.toLowerCase().includes(filter.programa.toLowerCase());
          }
          if (filter.grupo) {
            matches = matches && p.grupo.toLowerCase().includes(filter.grupo.toLowerCase());
          }
          if (filter.fechaInicio && filter.fechaFin) {
            // Add date filtering here when we have a date field to filter on
            // const fecha = new Date(p.fechaCreacion);
            // const inicio = new Date(filter.fechaInicio);
            // const fin = new Date(filter.fechaFin);
            // matches = matches && fecha >= inicio && fecha <= fin;
          }
          return matches;
        });
      })
    );
  }

  getProspectoById(id: string): Observable<Prospecto | undefined> {
    return this.prospectos.pipe(
      map(prospectos => prospectos.find(p => p.id === id))
    );
  }

  setSelectedProspecto(prospecto: Prospecto | null) {
    this.selectedProspectoSubject.next(prospecto);
  }

  createProspecto(prospecto: Prospecto): void {
    const currentProspectos = this.prospectos.value;
    const newProspecto = {
      ...prospecto,
      id: this.generateId(),
      estado: 'Pendiente',
      documento: `${prospecto.tipoDocumento}-${prospecto.numeroDocumento}`,
      asociado: `${prospecto.nombres} ${prospecto.apellidos}`
    };
    this.prospectos.next([...currentProspectos, newProspecto]);
  }

  updateProspecto(id: string, prospecto: Prospecto): void {
    const currentProspectos = this.prospectos.value;
    const index = currentProspectos.findIndex(p => p.id === id);
    if (index !== -1) {
      const updatedProspecto = {
        ...prospecto,
        id,
        documento: `${prospecto.tipoDocumento}-${prospecto.numeroDocumento}`,
        asociado: `${prospecto.nombres} ${prospecto.apellidos}`
      };
      const updatedProspectos = [...currentProspectos];
      updatedProspectos[index] = updatedProspecto;
      this.prospectos.next(updatedProspectos);
    }
  }

  deleteProspecto(id: string): Observable<boolean> {
    const currentProspectos = this.prospectos.value;
    const index = currentProspectos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prospectos.next(currentProspectos.filter(p => p.id !== id));
      return new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });
    }
    return new Observable(subscriber => {
      subscriber.next(false);
      subscriber.complete();
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
