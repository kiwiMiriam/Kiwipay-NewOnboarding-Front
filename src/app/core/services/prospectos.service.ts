import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ProspectoFilter } from '../models/prospecto.model';

export interface Prospecto {
  id: string;
  contrato: string;
  estado: string;
  documento: string;
  asociado: string;
  programa: string;
  grupo: string;
  ciudad: string;
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
  private prospectos = new BehaviorSubject<Prospecto[]>([
    {
      id: '1',
      contrato: 'CNT001',
      estado: 'Pendiente',
      documento: 'DNI-12345678',
      asociado: 'Juan Pérez',
      programa: 'Programa A',
      grupo: 'Grupo 1',
      ciudad: 'Lima',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombres: 'Juan',
      apellidos: 'Pérez',
      estadoCivil: 'SOLTERO',
      fechaNacimiento: '1990-01-01',
      sexo: 'M',
      correo: 'juan@example.com',
      telefono: '999888777',
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Miraflores',
      direccion: 'Av. Principal 123'
    },
    {
      id: '2',
      contrato: 'CNT002',
      estado: 'En Proceso',
      documento: 'DNI-87654321',
      asociado: 'María García',
      programa: 'Programa B',
      grupo: 'Grupo 2',
      ciudad: 'Arequipa',
      tipoDocumento: 'DNI',
      numeroDocumento: '87654321',
      nombres: 'María',
      apellidos: 'García',
      estadoCivil: 'CASADO',
      fechaNacimiento: '1992-05-15',
      sexo: 'F',
      correo: 'maria@example.com',
      telefono: '999777666',
      departamento: 'Arequipa',
      provincia: 'Arequipa',
      distrito: 'Cayma',
      direccion: 'Calle Secundaria 456'
    }
  ]);

  private selectedProspectoSubject = new BehaviorSubject<Prospecto | null>(null);
  selectedProspecto$ = this.selectedProspectoSubject.asObservable();

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
