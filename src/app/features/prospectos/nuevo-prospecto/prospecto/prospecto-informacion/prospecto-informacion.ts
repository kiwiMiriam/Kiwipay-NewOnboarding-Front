import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { InformacionProspecto } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto-informacion',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="section-container">
    <div class="info-container">
      <h3>Informacion del paciente</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionPersonal | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || 'N/A'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Informacion del prestamo</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionPrestamo | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || 'N/A'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="info-container">
      <h3>Informacion médica</h3>
      <table>
        <tbody>
          <tr *ngFor="let item of informacionMedica | keyvalue">
            <td class="label">{{item.key}}</td>
            <td class="value">{{item.value || 'N/A'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styleUrl: './prospecto-informacion.scss',
})
export class ProspectoInformacion implements OnInit {
  @Input() informacion?: InformacionProspecto;

  informacionPersonal: any = {};
  informacionPrestamo: any = {};
  informacionMedica: any = {};

  ngOnInit(): void {
    if (this.informacion) {
      this.informacionPersonal = this.informacion.informacionPersonal || {};
      this.informacionPrestamo = this.informacion.informacionPrestamo || {};
      this.informacionMedica = this.informacion.informacionMedica || {};
    } else {
      // Default mock data
      this.informacionPersonal = {
        'Nombres': 'SUHAIL ADRIANA',
        'Apellidos': 'ALDREY TABAREZ',
        'Documento de identidad': '004297536',
        'Telefono celular': '+51 917950100',
        'Correo electrónico': 'suhailaldrey216@gmail.com',
        'Fecha de Nacimiento': '1974-06-29',
        'Edad': '51 años',
        'Ingresos mensuales': 'S/ 3,000.00',
        'Score experian': 0,
        'Grupo': '',
        'Resultado experian': '',
        'Calificacion experian': 'Tabla de peor calificación experian',
        'Segmento': '',
        'Respuesta experian': '',
      };
      this.informacionPrestamo = {
        'Campaña': 'Sin campaña',
        'Fecha de solicitud ': '2025-10-20',
        'Estado de préstamo': 'Crédito con QR Redimido',
        'Préstamo solicitado': 'S/ 15,000.00',
        'Número de cuotas': '12',
        'Cuota Mensual': 'S/ 580.00',
      };
      this.informacionMedica = {
        'Centro médico': 'dr. luis coa',
        'Sucursal': 'san clemente',
        'Categoría médica': 'cirugía plástica y reconstructiva',
      };
    }
  }
}
