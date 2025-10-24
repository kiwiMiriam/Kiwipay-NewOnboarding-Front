import { Component } from '@angular/core';
import { ProspectoTitular } from "./prospecto-titular/prospecto-titular";
import { ProspectoInformacion } from "./prospecto-informacion/prospecto-informacion";
import { ProspectoDocumentos } from "./prospecto-documentos/prospecto-documentos";
import { ProspectoPaciente } from "./prospecto-paciente/prospecto-paciente";
import { ProspectoAval } from "./prospecto-aval/prospecto-aval";

@Component({
  selector: 'app-prospecto',
  imports: [ProspectoTitular, ProspectoInformacion, ProspectoDocumentos, ProspectoPaciente, ProspectoAval],
  template: `
  <section>

    <app-prospecto-titular></app-prospecto-titular>
    <app-prospecto-paciente></app-prospecto-paciente>
    <app-prospecto-aval></app-prospecto-aval>
    <app-prospecto-documentos></app-prospecto-documentos>
    <app-prospecto-informacion></app-prospecto-informacion>

  </section>
  `,
  styleUrls: ['./prospecto.scss'],
})
export default class Prospecto { }
