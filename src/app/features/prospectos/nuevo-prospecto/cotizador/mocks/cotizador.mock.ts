import { CotizacionResponse } from '../models/cotizador.models';

export const MOCK_COTIZACION_RESPONSE: CotizacionResponse = {
  success: true,
  data: {
    strStatus: "Aprobado",
    dcmTEA: 59.60,
    dcmTCEA: 60.67,
    payment: {
      dcmMaf: 12189.20,
      listQuotas: {
        "18Quotas": 14989.97,
        "16Quotas": 14056.69,
        "14Quotas": 12999.44,
        "12Quotas": 11799.54,
        "6Quotas": 7100.35
      }
    },
    isCampaing: false,
    campaing: {
      intIdCampaing: 0,
      strCampaing: null,
      dcmTEA: 0,
      dcmTCEA: 0,
      dcmMaf: 0,
      listQuotas: null
    }
  },
  message: ""
};

export const MOCK_COTIZACION_RESPONSE_2_WITH_CAMPAIGN: CotizacionResponse = {
  success: true,
  data: {
    strStatus: "Aprobado",
    dcmTEA: 59.60,
    dcmTCEA: 60.67,
    payment: {
      dcmMaf: 12189.20,
      listQuotas: {
        "18Quotas": 14989.97,
        "16Quotas": 14056.69,
        "14Quotas": 12999.44,
        "12Quotas": 11799.54,
        "6Quotas": 7100.35
      }
    },
    isCampaing: true,
    campaing: {
      intIdCampaing: 1,
      strCampaing: "Campaña Meses sin Intereses",
      dcmTEA: 0,
      dcmTCEA: 0,
      dcmMaf: 6144.73,
        listQuotas: {
        "12Quotas": 0,
        "6Quotas": 8022.93,
        "3Quotas": 4266.53
      }
    }
  },
  message: ""
}


export const MOCK_COTIZACION_RECHAZO_TRUJILLO: CotizacionResponse = {
  success: false,
  data: {
    strStatus: null as unknown as string,
    dcmTEA: 0,
    dcmTCEA: 0,
    payment: null as unknown as any,
    isCampaing: false,
    campaing: null as unknown as any
  },
  message: "Cuota Kiwi no apta para prestamo;"
};

