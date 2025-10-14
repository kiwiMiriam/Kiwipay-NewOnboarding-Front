// This interface defines the structure of a Prospecto filter
export interface ProspectoFilter {
  contrato?: string;
  documento?: string;
  asociado?: string;
  programa?: string;
  grupo?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

// This interface defines the structure of a Prospecto response
export interface ProspectoResponse {
  id: string;
  contrato: string;
  estado: string;
  documento: string;
  asociado: string;
  programa: string;
  grupo: string;
  ciudad: string;
}

// This interface extends ProspectoResponse to include all client data
export interface ProspectoDetalle extends ProspectoResponse {
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
