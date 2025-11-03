import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Prospecto, ProspectosService } from '@src/app/core/services/prospectos.service';
import { ubicacionMap } from '@src/app/shared/constants/ubicacionMap';
import { DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";

@Component({
  selector: 'app-prospecto-aval',
  imports: [DocumentTableComponent],
  templateUrl: './prospecto-aval.html',
  styleUrl: '../prospecto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProspectoAval {
   clientForm!: FormGroup;
 // Control de secciones expandibles
  isPacienteExpanded = false;
  ubicacionMap = ubicacionMap;

   constructor(
    private fb: FormBuilder,
    private prospectosService: ProspectosService,

  ) {
    this.initForm();
  }


  private loadProspectoData(id: string) {
      this.prospectosService.getProspectos().subscribe(
        (prospectos: Prospecto[]) => {
          const prospecto = prospectos.find(p => p.id === id);
          if (prospecto) {
            if (prospecto.paciente) {
              this.isPacienteExpanded = true;
            }

            this.clientForm.patchValue(prospecto);

            if (prospecto.departamento) {
              this.onDepartamentoChange();
            }
            if (prospecto.provincia) {
              this.onProvinciaChange();
            }
          }
        },
        (error: Error) => {
          console.error('Error loading prospecto:', error);
        }
      );
    }

     // Datos para los dropdowns de ubicación
  departamentos = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Chiclayo'];
  provincias: string[] = [];
  distritos: string[] = [];

  // Datos para el paciente (opcional)
  pacienteProvincias: string[] = [];
  pacienteDistritos: string[] = [];


  private initForm(): void {
    // Crear el formulario con validación
    this.clientForm = this.fb.group({

      // INFORMACIÓN PACIENTE (opcional)
      paciente: this.fb.group({
        tipoDocumento: [''],
        numeroDocumento: [''],
        nombres: [''],
        apellidos: [''],
        sexo: [''],
        telefono: [''],
        correo: ['', Validators.email],
        departamento: [''],
        provincia: [''],
        distrito: [''],
        direccion: ['']
      }),
    });
  }

  // Acceso a los controles del formulario para validación
  get f() { return this.clientForm.controls; }


    // Manejo de cambios en las ubicaciones
  onDepartamentoChange(): void {
    const dpto = this.clientForm.get('departamento')?.value;
    if (dpto && this.ubicacionMap[dpto]) {
      this.provincias = Object.keys(this.ubicacionMap[dpto]);
      this.clientForm.patchValue({
        provincia: '',
        distrito: ''
      });
      this.distritos = [];
    }
  }

  onProvinciaChange(): void {
    const dpto = this.clientForm.get('departamento')?.value;
    const prov = this.clientForm.get('provincia')?.value;

    if (dpto && prov && this.ubicacionMap[dpto] && this.ubicacionMap[dpto][prov]) {
      this.distritos = this.ubicacionMap[dpto][prov];
      this.clientForm.patchValue({
        distrito: ''
      });
    }
  }

  // Manejo de cambios en las ubicaciones para el paciente
  onPacienteDepartamentoChange(): void {
    const dpto = this.clientForm.get('paciente')?.get('departamento')?.value;
    if (dpto && this.ubicacionMap[dpto]) {
      this.pacienteProvincias = Object.keys(this.ubicacionMap[dpto]);
      this.clientForm.get('paciente')?.patchValue({
        provincia: '',
        distrito: ''
      });
      this.pacienteDistritos = [];
    }
  }

  onPacienteProvinciaChange(): void {
    const dpto = this.clientForm.get('paciente')?.get('departamento')?.value;
    const prov = this.clientForm.get('paciente')?.get('provincia')?.value;

    if (dpto && prov && this.ubicacionMap[dpto] && this.ubicacionMap[dpto][prov]) {
      this.pacienteDistritos = this.ubicacionMap[dpto][prov];
      this.clientForm.get('paciente')?.patchValue({
        distrito: ''
      });
    }
  }

  // Manejo de secciones expandibles
  togglePaciente(): void {
    this.isPacienteExpanded = !this.isPacienteExpanded;
  }


  // Datos de ejemplo para la tabla de documentos
  documentos = [
  {
      nombre: 'Contrato.pdf',
      fechaCarga: new Date('2025-10-10'),
      fechaRevision: new Date('2025-10-12'),
      comentario: 'Pendiente de aprobación',
      estadoRevision: DocumentoEstado.Pendiente
    },
    {
      nombre: 'Factura_123.pdf',
      fechaCarga: new Date('2025-10-15'),
      fechaRevision: new Date('2025-10-16'),
      comentario: 'Aprobado',
      estadoRevision: DocumentoEstado.Aprobado
    }
  ];

}
