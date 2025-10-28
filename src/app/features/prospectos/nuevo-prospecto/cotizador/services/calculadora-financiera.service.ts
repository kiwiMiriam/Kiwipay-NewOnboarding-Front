import { Injectable } from '@angular/core';
import { CalculadoraConfig, CuotaCalculada } from '../models/calculadora.models';

@Injectable({
  providedIn: 'root'
})
export class CalculadoraFinancieraService {
  private readonly IGV = 0.18;
  private readonly FACTOR_MENSUAL = 1/12;
  private readonly FACTOR_SEGURO = 0.00058;

  /**
   * Calcula la cuota mensual para crédito regular con interés compuesto
   */
  calcularCuotaRegular(config: CalculadoraConfig): CuotaCalculada {
    const tem = Math.pow(1 + config.tea / 100, this.FACTOR_MENSUAL) - 1;
    const tcem = tem + this.FACTOR_SEGURO;

    // Cálculo de cuota sin IGV usando la fórmula financiera
    const factor = Math.pow(1 + tcem, config.numCuotas);
    const cuotaSinIgv = config.monto * (tcem * factor) / (factor - 1);

    // Cálculo del IGV
    const igvMensual = config.monto * tcem * this.IGV;

    // Cuota final redondeada hacia arriba
    const cuotaFinal = Math.ceil(cuotaSinIgv + igvMensual);

    return {
      numCuotas: config.numCuotas,
      montoMensual: cuotaFinal,
      montoTotal: cuotaFinal * config.numCuotas,
      tea: config.tea,
      tcea: config.tcea,
      esCampania: false
    };
  }

  /**
   * Calcula la cuota mensual para crédito en campaña (sin intereses)
   */
  calcularCuotaCampania(config: CalculadoraConfig): CuotaCalculada {
    const cuotaMensual = Math.ceil(config.monto / config.numCuotas);

    return {
      numCuotas: config.numCuotas,
      montoMensual: cuotaMensual,
      montoTotal: cuotaMensual * config.numCuotas,
      tea: 0,
      tcea: 0,
      esCampania: true
    };
  }

  /**
   * Valida si un monto está dentro del rango permitido para un plan de cuotas
   */
  validarMontoCuota(monto: number, montoMaximo: number): boolean {
    return monto > 0 && monto <= montoMaximo;
  }

  /**
   * Calcula el monto máximo financiable por cuota según la TEA
   */
  calcularMontoMaximoPorCuota(tea: number, numCuotas: number, montoMaximoTotal: number): number {
    const tem = Math.pow(1 + tea / 100, this.FACTOR_MENSUAL) - 1;
    const tcem = tem + this.FACTOR_SEGURO;
    const factor = Math.pow(1 + tcem, numCuotas);

    // Calculamos el monto máximo que resultaría en la cuota máxima permitida
    const montoMaximoPorCuota = montoMaximoTotal / ((tcem * factor) / (factor - 1) + tcem * this.IGV);

    return Math.floor(montoMaximoPorCuota);
  }
}
