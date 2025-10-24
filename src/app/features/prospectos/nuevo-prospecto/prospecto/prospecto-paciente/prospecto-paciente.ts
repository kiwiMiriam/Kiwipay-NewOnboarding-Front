import { Component } from '@angular/core';
import { Prospecto} from '@app/core/services/prospectos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProspectosService } from '@src/app/core/services/prospectos.service';

@Component({
  selector: 'app-prospecto-paciente',
  imports: [],
  templateUrl: './prospecto-paciente.html',
  styleUrls: ['../prospecto.scss']
})
export class ProspectoPaciente {
  clientForm!: FormGroup;
 // Control de secciones expandibles
  isPacienteExpanded = false;

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

  // Mapeo de departamentos a provincias (simplificado para demostración)
  private ubicacionMap: {[key: string]: {[key: string]: string[]}} = {
    'Lima': {
      'Lima': ['Miraflores', 'San Isidro', 'San Borja', 'Surco', 'La Molina'],
      'Callao': ['Callao', 'La Punta', 'Ventanilla']
    },
    'Arequipa': {
      'Arequipa': ['Cercado', 'Cayma', 'Yanahuara', 'José Luis Bustamante y Rivero']
    },
    'Cusco': {
      'Cusco': ['Cusco', 'San Sebastián', 'San Jerónimo', 'Wanchaq']
    },
    'Trujillo': {
      'Trujillo': ['Trujillo', 'Victor Larco', 'La Esperanza', 'El Porvenir']
    }
  };

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

}
