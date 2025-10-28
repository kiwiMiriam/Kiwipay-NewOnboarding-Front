import { Injectable } from '@angular/core';
import { CotizacionResponse, CuotaOption } from '../models/cotizador.models';
import { CalculadoraFinancieraService } from './calculadora-financiera.service';
import { CuotaCalculada, ResultadoCotizacion, ValidationError } from '../models/calculadora.models';

@Injectable({
  providedIn: 'root'
})
export class CuotasCalculatorService {
  constructor(private calculadora: CalculadoraFinancieraService) {}

  /**
   * Procesa las opciones de cuotas basado en la respuesta de cotización
   */
  procesarOpcionesCuotas(cotizacion: CotizacionResponse, montoSolicitado: number): ResultadoCotizacion {
    const { data } = cotizacion;
    const montoMaximo = data.payment.dcmMaf;

    if (!this.calculadora.validarMontoCuota(montoSolicitado, montoMaximo)) {
      throw new ValidationError(`El monto solicitado (${montoSolicitado}) excede el máximo permitido (${montoMaximo})`);
    }

    const cuotasRegulares = this.calcularCuotasRegulares(data.payment.listQuotas, montoSolicitado, data.dcmTEA, data.dcmTCEA);

    const cuotasCampania = data.isCampaing && data.campaing.listQuotas
      ? this.calcularCuotasCampania(data.campaing.listQuotas, montoSolicitado)
      : [];

    return {
      cuotasRegulares,
      cuotasCampania,
      montoMaximo,
      haycampaniaActiva: data.isCampaing
    };
  }

  /**
   * Convierte el resultado del cálculo a opciones de cuotas para la UI
   */
  convertirACuotasUI(cuotasCalculadas: CuotaCalculada[]): CuotaOption[] {
    return cuotasCalculadas.map(cuota => ({
      id: `${cuota.numCuotas}Quotas`,
      label: this.generarLabelCuota(cuota.numCuotas, cuota.montoMensual, cuota.esCampania),
      value: cuota.numCuotas,
      monto: cuota.montoMensual,
      montoTotal: cuota.montoTotal,
      tea: cuota.tea,
      tcea: cuota.tcea,
      esCampania: cuota.esCampania
    }));
  }

  private calcularCuotasRegulares(
    listQuotas: { [key: string]: number },
    monto: number,
    tea: number,
    tcea: number
  ): CuotaCalculada[] {
    return Object.keys(listQuotas).map(key => {
      const numCuotas = parseInt(key.replace('Quotas', ''));
      return this.calculadora.calcularCuotaRegular({
        monto,
        tea,
        tcea,
        numCuotas,
        igv: 0.18
      });
    });
  }

  private calcularCuotasCampania(
    listQuotas: { [key: string]: number },
    monto: number
  ): CuotaCalculada[] {
    return Object.keys(listQuotas).map(key => {
      const numCuotas = parseInt(key.replace('Quotas', ''));
      return this.calculadora.calcularCuotaCampania({
        monto,
        tea: 0,
        tcea: 0,
        numCuotas,
        igv: 0
      });
    });
  }

  private generarLabelCuota(numCuotas: number, montoCuota: number, esCampania: boolean): string {
    const tipoCuota = esCampania ? '(Campaña)' : '';
    return `${numCuotas} cuotas mensuales de S/ ${montoCuota.toFixed(2)} ${tipoCuota}`.trim();
  }

  ordenarOpciones(opciones: CuotaOption[]): CuotaOption[] {
    return [...opciones].sort((a, b) => {
      // Primero ordenamos por campaña (las cuotas de campaña van primero)
      if (a.esCampania && !b.esCampania) return -1;
      if (!a.esCampania && b.esCampania) return 1;

      // Luego ordenamos por número de cuotas (de mayor a menor)
      return b.value - a.value;
    });
  }
}
