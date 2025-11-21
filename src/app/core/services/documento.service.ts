import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@src/environments/environment';
import { DocumentoData } from './prospecto-api.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private baseUrl = `${environment.kiwiPayApi}/documentos`;

  constructor(private http: HttpClient) {}

  subirDocumento(documentoId: string, archivo: File): Observable<DocumentoData> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<DocumentoData>(`${this.baseUrl}/${documentoId}/upload`, formData);
  }

  descargarDocumento(documentoId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${documentoId}/download`, {
      responseType: 'blob'
    });
  }

  aprobarDocumento(documentoId: string, comentario: string): Observable<DocumentoData> {
    return this.http.put<DocumentoData>(`${this.baseUrl}/${documentoId}/aprobar`, { comentario });
  }

  rechazarDocumento(documentoId: string, comentario: string): Observable<DocumentoData> {
    return this.http.put<DocumentoData>(`${this.baseUrl}/${documentoId}/rechazar`, { comentario });
  }
}


