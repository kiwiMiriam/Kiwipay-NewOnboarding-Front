export interface CuotaCalculada {
  numCuotas: number;
  montoMensual: number;
  montoTotal: number;
  tea: number;
  tcea: number;
  esCampania: boolean;
}

export interface CalculadoraConfig {
  monto: number;
  tea: number;
  tcea: number;
  numCuotas: number;
  igv: number;
}

export interface ResultadoCotizacion {
  cuotasRegulares: CuotaCalculada[];
  cuotasCampania: CuotaCalculada[];
  montoMaximo: number;
  haycampaniaActiva: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
