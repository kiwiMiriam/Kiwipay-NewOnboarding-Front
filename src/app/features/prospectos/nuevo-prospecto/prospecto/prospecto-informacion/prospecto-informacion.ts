import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-prospecto-informacion',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div>
    <div class="info-container">
      <h3  >Informacion del paciente</h3>
      <table>
        <tbody>

          <tr *ngFor="let item of informacionPersonal | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3  >Informacion del prestamo</h3>
      <table>
        <tbody>

          <tr *ngFor="let item of informacionPrestamo | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value}}</td>
          </tr>
        </tbody>
      </table>
    </div>
     <div class="info-container">
      <h3  >Informacion médica</h3>
      <table>
        <tbody>

          <tr *ngFor="let item of informacionMedica | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>


`,
  styleUrl: './prospecto-informacion.scss',
})
export class ProspectoInformacion {

    informacionPersonal = {
    'Nombres': 'SUHAIL ADRIANA',
    'Apellidos': 'ALDREY TABAREZ',
    'Documento': '004297536',
    'Celular': '+51 917950100',
    'Correo': 'suhailaldrey216@gmail.com',
    'Fecha de Nacimiento': '1974-06-29',
    'Edad': '51 años',
    'Ingresos': 'S/ 3,000.00',
    'Score': 0,
    'Grupo': '',
    'Resultado': '',
    'Calificacion': 'Tabla de peor calificación experian',
    'Segmento': '',
    'Respuesta': '',
  };
  informacionPrestamo = {
    'Campaña': 'Sin campaña',
    'Fecha de solicitud ': '2025-10-20',
    'Estado de préstamo': 'Crédito con QR Redimido',
    'Préstamo solicitado': 'S/ 15,000.00',
    'Número de cuotas': '12',
    'Cuota Mensual': 'S/ 580.00',
  };
  informacionMedica = {
    'Centro médico': 'dr. luis coa',
    'Sucursal': 'san clemente',
    'Categoría médica': 'cirugía plástica y reconstructiva',
  };

}
