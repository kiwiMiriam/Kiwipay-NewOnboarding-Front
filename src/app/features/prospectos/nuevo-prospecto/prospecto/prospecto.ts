import { Component } from '@angular/core';
import { ProspectoTitular } from './prospecto-titular/prospecto-titular';
import { ProspectoInformacion } from './prospecto-informacion/prospecto-informacion';
import { ProspectoDocumentos } from './prospecto-documentos/prospecto-documentos';
import { ProspectoPaciente } from './prospecto-paciente/prospecto-paciente';
import { ProspectoAval } from './prospecto-aval/prospecto-aval';

@Component({
  selector: 'app-prospecto',
  imports: [
    ProspectoTitular,
    ProspectoInformacion,
    ProspectoDocumentos,
    ProspectoPaciente,
    ProspectoAval,
  ],
  template: `
    <section class="section-container">
      <app-prospecto-titular></app-prospecto-titular>
      <app-prospecto-paciente></app-prospecto-paciente>
      <app-prospecto-aval></app-prospecto-aval>
      <app-prospecto-documentos></app-prospecto-documentos>
      <div class="navigation-buttons containerBtn">
        <button type="submit" class="btn-secondary">Desaprobacion manual</button>
        <button type="submit" class="btn-primary">Aprobacion manual</button>
      </div>
      <app-prospecto-informacion></app-prospecto-informacion>
    </section>
  `,
  styleUrls: ['./prospecto.scss'],
})
export default class Prospecto {


}
