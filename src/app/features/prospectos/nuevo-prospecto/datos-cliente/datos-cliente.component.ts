import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-datos-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="section-container">

      <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
        <!-- INFORMACIÓN TITULAR -->
        <div class="section-header">
          <h4>Información del Titular</h4>
          <small class="required-note">Los campos marcados con * son obligatorios</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="tipoDocumento">Tipo de Documento *</label>
            <select id="tipoDocumento" formControlName="tipoDocumento">
              <option value="">Seleccione...</option>
              <option value="DNI">DNI</option>
              <option value="CE">Carnet de Extranjería</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
            @if (submitted && f['tipoDocumento'].errors) {
              <div class="error-message">El tipo de documento es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="numeroDocumento">Número de Documento *</label>
            <input type="text" id="numeroDocumento" formControlName="numeroDocumento">
            @if (submitted && f['numeroDocumento'].errors) {
              <div class="error-message">
                @if (f['numeroDocumento'].errors['required']) {
                  El número de documento es requerido
                } @else if (f['numeroDocumento'].errors['pattern']) {
                  El formato del documento no es válido
                }
              </div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="nombres">Nombres *</label>
            <input type="text" id="nombres" formControlName="nombres">
            @if (submitted && f['nombres'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="apellidos">Apellidos *</label>
            <input type="text" id="apellidos" formControlName="apellidos">
            @if (submitted && f['apellidos'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="estadoCivil">Estado Civil *</label>
            <select id="estadoCivil" formControlName="estadoCivil">
              <option value="">Seleccione...</option>
              <option value="SOLTERO">Soltero(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUDO">Viudo(a)</option>
              <option value="CONVIVIENTE">Conviviente</option>
            </select>
            @if (submitted && f['estadoCivil'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="fechaNacimiento">Fecha de Nacimiento *</label>
            <input type="date" id="fechaNacimiento" formControlName="fechaNacimiento">
            @if (submitted && f['fechaNacimiento'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="sexo">Sexo *</label>
            <select id="sexo" formControlName="sexo">
              <option value="">Seleccione...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            @if (submitted && f['sexo'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="correo">Correo Electrónico *</label>
            <input type="email" id="correo" formControlName="correo">
            @if (submitted && f['correo'].errors) {
              <div class="error-message">
                @if (f['correo'].errors['required']) {
                  El correo es requerido
                } @else if (f['correo'].errors['email']) {
                  El formato del correo no es válido
                }
              </div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="telefono">Teléfono *</label>
            <input type="tel" id="telefono" formControlName="telefono">
            @if (submitted && f['telefono'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="departamento">Departamento *</label>
            <select id="departamento" formControlName="departamento" (change)="onDepartamentoChange()">
              <option value="">Seleccione...</option>
              @for (dep of departamentos; track dep) {
                <option [value]="dep">{{dep}}</option>
              }
            </select>
            @if (submitted && f['departamento'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="provincia">Provincia *</label>
            <select id="provincia" formControlName="provincia" (change)="onProvinciaChange()">
              <option value="">Seleccione...</option>
              @for (prov of provincias; track prov) {
                <option [value]="prov">{{prov}}</option>
              }
            </select>
            @if (submitted && f['provincia'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="distrito">Distrito *</label>
            <select id="distrito" formControlName="distrito">
              <option value="">Seleccione...</option>
              @for (dist of distritos; track dist) {
                <option [value]="dist">{{dist}}</option>
              }
            </select>
            @if (submitted && f['distrito'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>

          <div class="form-group full-width">
            <label for="direccion">Dirección *</label>
            <input type="text" id="direccion" formControlName="direccion">
            @if (submitted && f['direccion'].errors) {
              <div class="error-message">Este campo es requerido</div>
            }
          </div>
        </div>

        <!-- INFORMACIÓN PACIENTE (Sección expandible - opcional) -->
        <div class="expandable-section">
          <div class="section-toggle" (click)="togglePaciente()">
            <div class="section-header">
              <h4>Información del Paciente</h4>
              <small>(opcional)</small>
            </div>
            <span class="toggle-icon">{{ isPacienteExpanded ? '▼' : '►' }}</span>
          </div>

          @if (isPacienteExpanded) {
            <div class="expanded-content" formGroupName="paciente">
              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteTipoDocumento">Tipo de Documento</label>
                  <select id="pacienteTipoDocumento" formControlName="tipoDocumento">
                    <option value="">Seleccione...</option>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="pacienteNumeroDocumento">Número de Documento</label>
                  <input type="text" id="pacienteNumeroDocumento" formControlName="numeroDocumento">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteNombres">Nombres</label>
                  <input type="text" id="pacienteNombres" formControlName="nombres">
                </div>

                <div class="form-group">
                  <label for="pacienteApellidos">Apellidos</label>
                  <input type="text" id="pacienteApellidos" formControlName="apellidos">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteSexo">Sexo</label>
                  <select id="pacienteSexo" formControlName="sexo">
                    <option value="">Seleccione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="pacienteTelefono">Teléfono</label>
                  <input type="tel" id="pacienteTelefono" formControlName="telefono">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteCorreo">Correo Electrónico</label>
                  <input type="email" id="pacienteCorreo" formControlName="correo">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteDepartamento">Departamento</label>
                  <select id="pacienteDepartamento" formControlName="departamento" (change)="onPacienteDepartamentoChange()">
                    <option value="">Seleccione...</option>
                    @for (dep of departamentos; track dep) {
                      <option [value]="dep">{{dep}}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label for="pacienteProvincia">Provincia</label>
                  <select id="pacienteProvincia" formControlName="provincia" (change)="onPacienteProvinciaChange()">
                    <option value="">Seleccione...</option>
                    @for (prov of pacienteProvincias; track prov) {
                      <option [value]="prov">{{prov}}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="pacienteDistrito">Distrito</label>
                  <select id="pacienteDistrito" formControlName="distrito">
                    <option value="">Seleccione...</option>
                    @for (dist of pacienteDistritos; track dist) {
                      <option [value]="dist">{{dist}}</option>
                    }
                  </select>
                </div>

                <div class="form-group full-width">
                  <label for="pacienteDireccion">Dirección</label>
                  <input type="text" id="pacienteDireccion" formControlName="direccion">
                </div>
              </div>
            </div>
          }
        </div>

        <!-- INFORMACIÓN CONYUGUE (Sección expandible - opcional) -->
        <div class="expandable-section">
          <div class="section-toggle" (click)="toggleConyugue()">
            <div class="section-header">
              <h4>Información del Cónyuge</h4>
              <small>(opcional)</small>
            </div>
            <span class="toggle-icon">{{ isConyugueExpanded ? '▼' : '►' }}</span>
          </div>

          @if (isConyugueExpanded) {
            <div class="expanded-content" formGroupName="conyugue">
              <div class="form-row">
                <div class="form-group">
                  <label for="conyugueTipoDocumento">Tipo de Documento</label>
                  <select id="conyugueTipoDocumento" formControlName="tipoDocumento">
                    <option value="">Seleccione...</option>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="conyugueNumeroDocumento">Número de Documento</label>
                  <input type="text" id="conyugueNumeroDocumento" formControlName="numeroDocumento">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="conyugueNombres">Nombres</label>
                  <input type="text" id="conyugueNombres" formControlName="nombres">
                </div>

                <div class="form-group">
                  <label for="conyugueApellidos">Apellidos</label>
                  <input type="text" id="conyugueApellidos" formControlName="apellidos">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="conyugueCorreo">Correo Electrónico</label>
                  <input type="email" id="conyugueCorreo" formControlName="correo">
                </div>

                <div class="form-group">
                  <label for="conyugueTelefono">Teléfono</label>
                  <input type="tel" id="conyugueTelefono" formControlName="telefono">
                </div>
              </div>
            </div>
          }
        </div>

        <div class="form-buttons">
          <button type="submit" class="btn-primary">Guardar</button>
          <button type="button" class="btn-secondary" (click)="onCancel()">Cancelar</button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./datos-cliente.component.scss']
})
export class DatosClienteComponent {
  clientForm!: FormGroup;
  submitted = false;

  // Control de secciones expandibles
  isPacienteExpanded = false;
  isConyugueExpanded = false;

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

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    // Crear el formulario con validación
    this.clientForm = this.fb.group({
      // INFORMACIÓN TITULAR
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      estadoCivil: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      //categoriaMedica: [''],
      //clinica: [''],
      //sede: [''],
      //ingresos: ['', Validators.required],
      telefono: ['', Validators.required],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      direccion: ['', Validators.required],

      // INFORMACIÓN PACIENTE (opcional)
      paciente: this.fb.group({
        tipoDocumento: [''],
        numeroDocumento: [''],
        nombres: [''],
        apellidos: [''],
        sexo: [''],
        telefono: [''],
        correo: ['', Validators.email], // Solo validamos email si se ingresa
        departamento: [''],
        provincia: [''],
        distrito: [''],
        direccion: ['']
      }),

      // INFORMACIÓN CONYUGUE (opcional)
      conyugue: this.fb.group({
        tipoDocumento: [''],
        numeroDocumento: [''],
        nombres: [''],
        apellidos: [''],
        correo: ['', Validators.email], // Solo validamos email si se ingresa
        telefono: ['']
      })
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

  toggleConyugue(): void {
    this.isConyugueExpanded = !this.isConyugueExpanded;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.clientForm.invalid) {
      // Scrollear al primer error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Si el formulario es válido, procesamos los datos
    const formData = this.clientForm.value;

    // Limpiamos secciones opcionales vacías
    if (this.isPacienteExpanded === false || this.isEmpty(formData.paciente)) {
      delete formData.paciente;
    }

    if (this.isConyugueExpanded === false || this.isEmpty(formData.conyugue)) {
      delete formData.conyugue;
    }

    // Enviar datos a un servicio o API
    console.log('Datos del cliente:', formData);

    // Aquí normalmente llamaríamos a un servicio para guardar los datos
    // this.clienteService.guardarDatos(formData).subscribe(...);

    alert('Datos guardados correctamente');
  }

  // Verificar si un objeto tiene todos sus valores vacíos
  private isEmpty(obj: any): boolean {
    return Object.values(obj).every(value => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      return false;
    });
  }

  onCancel(): void {
    if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
      this.clientForm.reset();
      this.submitted = false;
    }
  }
}
