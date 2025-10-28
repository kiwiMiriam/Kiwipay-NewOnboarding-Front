import { Component } from '@angular/core';
import { Prospecto} from '@app/core/services/prospectos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProspectosService } from '@src/app/core/services/prospectos.service';
import { ubicacionMap } from '@src/app/shared/constants/ubicacionMap';

@Component({
  selector: 'app-prospecto-paciente',
  imports: [],
  templateUrl: './prospecto-paciente.html',
  styleUrls: ['../prospecto.scss']
})
export class ProspectoPaciente {
  clientForm!: FormGroup;
  ubicacionMap = ubicacionMap;
 // Control de secciones expandibles
  isPacienteExpanded = false;

   constructor(
    private fb: FormBuilder,
    private prospectosService: ProspectosService,

  ) {  }

  ngOnInit(): void {
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
              this.onPacienteDepartamentoChange();
            }
            if (prospecto.provincia) {
              this.onPacienteProvinciaChange();
            }
          }
        },
        (error: Error) => {
          console.error('Error loading prospecto:', error);
        }
      );
    }

     // Datos para los dropdowns de ubicación
  departamentos = ubicacionMap ? Object.keys(this.ubicacionMap) : [];
  provincias: string[] = [];
  distritos: string[] = [];

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
  //get f() { return this.clientForm.controls; }
  get pacienteForm() {
    return this.clientForm.get('paciente') as FormGroup;
  }

  // Manejo de cambios en las ubicaciones para el paciente
  onPacienteDepartamentoChange(): void {
    const dpto = this.pacienteForm.get('departamento')?.value;
    if (dpto && this.ubicacionMap[dpto]) {
      this.provincias = Object.keys(this.ubicacionMap[dpto]);
      console.log('Provincias cargadas:', this.provincias);
      this.distritos = [];

      this.pacienteForm.patchValue({
        provincia: '',
        distrito: ''
      });
    } else {
      this.provincias = [];
      this.distritos = [];
    }
  }

  onPacienteProvinciaChange(): void {
    const dpto = this.pacienteForm.get('departamento')?.value;
    const prov = this.pacienteForm.get('provincia')?.value;

    if (dpto && prov && this.ubicacionMap[dpto]?.[prov]) {
      this.distritos = this.ubicacionMap[dpto][prov];
      this.pacienteForm.patchValue({
        distrito: ''
      });
    } else {
      this.distritos = [];
    }
  }

  // Manejo de secciones expandibles
  togglePaciente(): void {
    this.isPacienteExpanded = !this.isPacienteExpanded;
  }

}
