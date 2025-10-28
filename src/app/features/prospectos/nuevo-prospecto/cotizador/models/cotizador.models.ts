export interface CotizacionPayload {
  TypeDocument: string;
  NumDocument: string;
  Income: string;
  IdHeadquarters: string;
}

export interface CotizacionResponse {
  success: boolean;
  data: {
    strStatus: string;
    dcmTEA: number;
    dcmTCEA: number;
    payment: {
      dcmMaf: number;
      listQuotas: {
        [key: string]: number;
      };
    };
    isCampaing: boolean;
    campaing: {
      intIdCampaing: number;
      strCampaing: string | null;
      dcmTEA: number;
      dcmTCEA: number;
      dcmMaf: number;
      listQuotas: any;
    };
  };
  message: string;
}

export interface CuotaOption {
  id: string;
  label: string;
  value: number;
  monto: number;
  montoTotal: number;
  tea: number;
  tcea: number;
  esCampania: boolean;
  selected?: boolean;
}

export interface FormularioCotizador {
  tipoDocumento: string;
  numeroDocumento: string;
  ingresos: number;
  sede: string;
}

export interface MontoSolicitado {
  monto: number;
}
