import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProspectosService, Prospecto } from '../../../../core/services/prospectos.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { LocationService } from '@src/app/core/services/location.service';
import { ProspectoApiService} from '../../../../core/services/prospecto-api.service';


@Component({
  selector: 'app-datos-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-cliente.component.html',
  styleUrls: ['./datos-cliente.component.scss']
})
export class DatosClienteComponent implements OnInit {
    guardarPaciente(): void {
      if (!this.prospectoId) return;

      const pacienteForm = this.clientForm.get('paciente')?.value;
      // PacienteData debe tener los siguientes campos:
      // tipoDocumento, numeroDocumento, nombres, apellidos, sexo, telefono, correo, departamento, provincia, distrito, direccion
      const pacienteData = {
        tipoDocumento: pacienteForm.tipoDocumento,
        numeroDocumento: pacienteForm.numeroDocumento,
        nombres: pacienteForm.nombres,
        apellidos: pacienteForm.apellidos,
        sexo: pacienteForm.sexo,
        telefono: pacienteForm.telefono,
        correo: pacienteForm.correo,
        departamento: pacienteForm.departamento,
        provincia: pacienteForm.provincia,
        distrito: pacienteForm.distrito,
        direccion: pacienteForm.direccion
      };

      // Si hay un id de paciente, es edición; si no, es creación
      if (pacienteForm.id) {
        this.prospectoApiService.updatePatient(Number(this.prospectoId), Number(pacienteForm.id), pacienteData).subscribe({
          next: () => alert('Paciente actualizado exitosamente'),
          error: (err: any) => {
            alert('Error al actualizar paciente');
            console.error(err);
          }
        });
      } else {
        this.prospectoApiService.createPatient(Number(this.prospectoId), pacienteData).subscribe({
          next: (res) => {
            alert('Paciente creado exitosamente');
            this.clientForm.get('paciente')?.patchValue({ id: res.id });
          },
          error: (err: any) => {
            alert('Error al crear paciente');
            console.error(err);
          }
        });
      }
    }
  clientForm!: FormGroup;
  submitted = false;
  editMode = false;
  prospectoId: string | null = null;

  // Control de secciones expandibles
  isPacienteExpanded = false;
  isConyugueExpanded = false;

  // Datos para los dropdowns de ubicación
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  // Para paciente (opcional)
  pacienteProvincias: any[] = [];
  pacienteDistritos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prospectoApiService: ProspectoApiService,
    private prospectosService: ProspectosService,
    private navigationService: NavigationService,
    private locationService: LocationService

  ) {
    this.initForm();
  }

  ngOnInit() {
    // Cargar departamentos al iniciar
    this.locationService.getDepartments().subscribe(deps => {
      this.departamentos = deps;
    });
    this.route.queryParams.subscribe(params => {
      this.prospectoId = params['id'];
      if (this.prospectoId) {
        this.editMode = true;
        this.loadProspectoData(this.prospectoId);
      }
    });
  }

  private loadProspectoData(id: string) {
    this.prospectosService.getProspectos().subscribe(
      (prospectos: Prospecto[]) => {
        const prospecto = prospectos.find(p => p.id === id);
        if (prospecto) {
          if (prospecto.paciente) this.isPacienteExpanded = true;
          if (prospecto.conyugue) this.isConyugueExpanded = true;

          this.clientForm.patchValue(prospecto);

          // Patch paciente si existe
          if (prospecto.paciente) {
            this.clientForm.get('paciente')?.patchValue({
              // Si el backend devuelve un id de paciente, lo usamos
              id: (prospecto.paciente as any).id,
              tipoDocumento: prospecto.paciente.tipoDocumento,
              numeroDocumento: prospecto.paciente.numeroDocumento,
              nombres: prospecto.paciente.nombres,
              apellidos: prospecto.paciente.apellidos,
              sexo: prospecto.paciente.sexo,
              telefono: prospecto.paciente.telefono,
              correo: prospecto.paciente.correo,
              departamento: prospecto.paciente.departamento,
              provincia: prospecto.paciente.provincia,
              distrito: prospecto.paciente.distrito,
              direccion: prospecto.paciente.direccion
            });
          }

          // Cargar provincias y distritos por ID
          if (prospecto.departamento) {
            this.locationService.getProvinces(prospecto.departamento).subscribe(provincias => {
              this.provincias = provincias;
              if (prospecto.provincia) {
                this.locationService.getDistricts(prospecto.provincia).subscribe(distritos => {
                  this.distritos = distritos;
                });
              }
            });
          }
        }
      },
      (error: Error) => {
        console.error('Error loading prospecto:', error);
      }
    );
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
        correo: ['', Validators.email],
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
        correo: ['', Validators.email],
        telefono: ['']
      })
    });
  }

  // Acceso a los controles del formulario para validación
  get f() { return this.clientForm.controls; }

  // Manejo de cambios en las ubicaciones
  onDepartamentoChange(): void {
    const dpto = this.clientForm.get('departamento')?.value;
    if (dpto) {
      this.locationService.getProvinces(dpto).subscribe(provincias => {
        this.provincias = provincias;
        this.clientForm.patchValue({ provincia: '', distrito: '' });
        this.distritos = [];
      });
    } else {
      this.provincias = [];
      this.distritos = [];
    }
  }

  onProvinciaChange(): void {
    const prov = this.clientForm.get('provincia')?.value;
    if (prov) {
      this.locationService.getDistricts(prov).subscribe(distritos => {
        this.distritos = distritos;
        this.clientForm.patchValue({ distrito: '' });
      });
    } else {
      this.distritos = [];
    }
  }

  // Manejo de cambios en las ubicaciones para el paciente
  onPacienteDepartamentoChange(): void {
    const dpto = this.clientForm.get('paciente')?.get('departamento')?.value;
    if (dpto) {
      this.locationService.getProvinces(dpto).subscribe(provincias => {
        this.pacienteProvincias = provincias;
        this.clientForm.get('paciente')?.patchValue({
          provincia: '',
          distrito: ''
        });
        this.pacienteDistritos = [];
      });
    } else {
      this.pacienteProvincias = [];
      this.pacienteDistritos = [];
    }
  }

  onPacienteProvinciaChange(): void {
    const prov = this.clientForm.get('paciente')?.get('provincia')?.value;
    if (prov) {
      this.locationService.getDistricts(prov).subscribe(distritos => {
        this.pacienteDistritos = distritos;
        this.clientForm.get('paciente')?.patchValue({
          distrito: ''
        });
      });
    } else {
      this.pacienteDistritos = [];
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

    const formData = this.clientForm.value;

    // Limpiamos secciones opcionales vacías
    if (!this.isPacienteExpanded || this.isEmpty(formData.paciente)) {
      delete formData.paciente;
    }

    if (!this.isConyugueExpanded || this.isEmpty(formData.conyugue)) {
      delete formData.conyugue;
    }

    const clienteData = {
      documentType: formData.tipoDocumento,
      documentNumber: formData.numeroDocumento,
      firstNames: formData.nombres,
      lastNames: formData.apellidos,
      maritalStatus: formData.estadoCivil,
      birthDate: formData.fechaNacimiento,
      gender: formData.sexo,
      email: formData.correo,
      phone: formData.telefono,
      address: {
        departmentId: formData.departamento,
        provinceId: formData.provincia,
        districtId: formData.distrito,
        line1: formData.direccion
      }
    };

    if (this.editMode && this.prospectoId) {
      // EDITAR
      this.prospectoApiService.updateClient(Number(this.prospectoId), clienteData).subscribe({
        next: () => alert('Prospecto actualizado exitosamente'),
        error: (err: any) => {
          alert('Error al actualizar prospecto');
          console.error(err);
        }
      });
    } else {
      // CREAR
      this.prospectoApiService.createClient(clienteData).subscribe({
        next: () => alert('Prospecto creado exitosamente'),
        error: (err: any) => {
          alert('Error al crear prospecto');
          console.error(err);
        }
      });
      if (confirm('Prospecto creado exitosamente. ¿Desea volver a la bandeja?')) {
        this.router.navigate(['/dashboard/bandeja']);
      } else {
        this.clientForm.reset();
        this.submitted = false;
        this.isPacienteExpanded = false;
        this.isConyugueExpanded = false;
      }
    }
  }

  // Verificar si un objeto tiene todos sus valores vacíos
  private isEmpty(obj: any): boolean {
    if (!obj) return true;
    return Object.values(obj).every(x => x === null || x === '' || x === undefined);
  }

  volverABandeja(): void {
    this.router.navigate(['/dashboard/bandeja']);
  }

  onCancel(): void {
    if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/dashboard/bandeja']);
    }
  }

  /**
   * Navega hacia adelante (clinica) y actualiza el estado de la pestaña activa
   */
  navigateNext(): void {
    // Usa el servicio de navegación para navegar hacia adelante desde la pestaña actual
    const newroute = this.navigationService.navigateToTab('datos-clinica');
    console.log(this.router.url);
    console.log(newroute);
  }

}
