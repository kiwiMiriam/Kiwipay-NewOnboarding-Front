import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProspectoApiService, ConyugeData } from './prospecto-api.service';

@Injectable({
  providedIn: 'root'
})
export class ConyugeService {

  constructor(private prospectoApiService: ProspectoApiService) {}

  /**
   * Obtiene el cónyuge de un cliente
   */
  getConyugeByClientId(clientId: number): Observable<ConyugeData | null> {
    return this.prospectoApiService.getSpouse(clientId).pipe(
      catchError(error => {
        console.error('Error fetching spouse:', error);
        return of(null);
      })
    );
  }

  /**
   * Crea un nuevo cónyuge
   */
  crearConyuge(clientId: number, conyugeData: ConyugeData): Observable<ConyugeData> {
    return this.prospectoApiService.createSpouse(clientId, conyugeData);
  }

  /**
   * Actualiza un cónyuge existente
   */
  actualizarConyuge(clientId: number, conyugeData: ConyugeData): Observable<ConyugeData> {
    return this.prospectoApiService.updateSpouse(clientId, conyugeData);
  }
}
