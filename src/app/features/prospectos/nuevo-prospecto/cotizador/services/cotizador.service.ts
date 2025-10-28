import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '@src/environments/environment';
import { EndPoints } from '@src/config/end_points';
import { CotizacionPayload, CotizacionResponse } from '../models/cotizador.models';
import { MOCK_COTIZACION_RESPONSE } from '../mocks/cotizador.mock';
import { SKIP_AUTH_TOKEN } from '@src/app/core/interceptors/skip-auth.context';

@Injectable({
  providedIn: 'root'
})
export class CotizadorService {
  private readonly apiUrl = environment.Back_Office_BaseUrl;
  private readonly apiKey = environment.Back_Office_ApiKey;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una cotización del servidor o retorna datos mock según la configuración
   */
  getCotizacion(payload: CotizacionPayload): Observable<CotizacionResponse> {
    if (environment.useMockApi) {
      return this.getMockCotizacion();
    }
    return this.getRealCotizacion(payload);
  }

  /**
   * Realiza la petición real al servidor con solo x-api-key header
   */
  private getRealCotizacion(payload: CotizacionPayload): Observable<CotizacionResponse> {
    const url = `${this.apiUrl}${EndPoints.BACKOFFICE.POST_GENERATE_PRE_APROBATE}`;
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('x-api-key', this.apiKey);

    const context = new HttpContext().set(SKIP_AUTH_TOKEN, true);

    return this.http.post<CotizacionResponse>(url, payload, {
      headers,
      context
    });

  }

  /**
   * Retorna una respuesta mock para desarrollo
   */
  /**
   * Verifica si el usuario es elegible para campaña especial
   */
  checkCampanaEligibility(): Observable<boolean> {
    if (environment.useMockApi) {
      // Por ahora retornamos true para desarrollo
      return of(true);
    }

    const url = `${this.apiUrl}${EndPoints.BACKOFFICE.GET_CHECK_CAMPAIGN_ELIGIBILITY}`;
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('x-api-key', this.apiKey);

    const context = new HttpContext().set(SKIP_AUTH_TOKEN, true);

    return this.http.get<boolean>(url, {
      headers,
      context
    });
  }

  private getMockCotizacion(): Observable<CotizacionResponse> {
    return of(MOCK_COTIZACION_RESPONSE);
  }
}
