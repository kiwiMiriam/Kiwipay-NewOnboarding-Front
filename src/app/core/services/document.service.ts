import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DocumentoData } from './prospecto-api.service';
import { environment } from '@src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private baseUrl = environment.kiwiPayApi;

  constructor(private http: HttpClient) {}

  downloadDocument(documento: DocumentoData): Observable<Blob> {
    const url = `${this.baseUrl}/documentos/${documento.id}/download`;
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      map(response => {
        return new Blob([response], { type: 'application/octet-stream' });
      })
    );
  }

  private getFileNameFromResponse(response: any): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    return 'document';
  }
}
