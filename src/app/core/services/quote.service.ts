import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProspectoApiService, QuoteData } from './prospecto-api.service';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  constructor(private prospectoApiService: ProspectoApiService) {}

  /**
   * Obtener todas las cotizaciones de un cliente
   */
  getQuotesByClientId(clientId: number): Observable<QuoteData[]> {
    return this.prospectoApiService.getQuotesByClientId(clientId);
  }

  /**
   * Crear una nueva cotización para un cliente
   */
  crearQuote(clientId: number, quoteData: Omit<QuoteData, 'id' | 'clientId'>): Observable<QuoteData> {
    return this.prospectoApiService.createQuote(clientId, quoteData);
  }

  /**
   * Actualizar una cotización existente
   */
  actualizarQuote(quoteId: number, quoteData: Omit<QuoteData, 'id' | 'clientId'>): Observable<QuoteData> {
    return this.prospectoApiService.updateQuote(quoteId, quoteData);
  }
}
