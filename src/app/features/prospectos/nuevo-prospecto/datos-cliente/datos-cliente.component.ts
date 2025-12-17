import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProspectosService, Prospecto } from '../../../../core/services/prospectos.service';
import { NavigationService } from '../../../../core/services/navigation.service';
import { LocationService } from '@src/app/core/services/location.service';
import { ToastService } from '@src/app/shared/components/toast/toast.service';
import { ProspectoApiService, ClienteData, PacienteData, ConyugeData } from '../../../../core/services/prospecto-api.service';
import { PacientesService } from '../../../../core/services/pacientes.service';
import { ConyugeService } from '../../../../core/services/conyuge.service';


@Component({
  selector: 'app-datos-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-cliente.component.html',
  styleUrls: ['./datos-cliente.component.scss']
})
export class DatosClienteComponent implements OnInit {
  clientForm!: FormGroup;
  submitted = false;
  editMode = false;
  prospectoId: string | null = null;
  clientId: number | null = null;
  pacienteId: number | null = null;
  pacienteEditMode = false;
  existingPacientes: PacienteData[] = [];
  
  // Control para cónyuge
  conyugeEditMode = false;

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
    private locationService: LocationService,
    private pacientesService: PacientesService,
    private conyugeService: ConyugeService,
    private toastService: ToastService
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
          this.editMode = true;
          this.clientId = Number(prospecto.id) || null; // Extraer clientId
          
          if (prospecto.paciente) this.isPacienteExpanded = true;
          if (prospecto.conyugue) this.isConyugueExpanded = true;

          this.clientForm.patchValue(prospecto);
          
          // Cargar suffersCondition si existe
          if (prospecto.suffersCondition !== undefined) {
            this.clientForm.patchValue({ suffersCondition: prospecto.suffersCondition });
          }
          
          // Cargar pacientes existentes del backend
          if (this.clientId) {
            this.loadExistingPacientes();
            this.loadExistingConyuge();
          }

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
      suffersCondition: [false],

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

  // Manejo del cambio de suffersCondition
  onSuffersConditionChange(value: boolean): void {
    this.clientForm.patchValue({ suffersCondition: value });
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

    // Preparar datos del cliente
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
      suffersCondition: formData.suffersCondition,
      address: {
        departmentId: formData.departamento,
        provinceId: formData.provincia,
        districtId: formData.distrito,
        line1: formData.direccion
      }
    };

    // Verificar si hay datos de paciente para guardar
    const pacienteData = formData.paciente;
    const tieneDatosPaciente = this.isPacienteExpanded && 
      pacienteData && 
      !this.isEmpty(pacienteData) && 
      pacienteData.tipoDocumento && 
      pacienteData.numeroDocumento && 
      pacienteData.nombres && 
      pacienteData.apellidos;

    // Verificar si hay datos de cónyuge para guardar
    const conyugeData = formData.conyugue;
    const tieneDatosConyuge = this.isConyugueExpanded && 
      conyugeData && 
      !this.isEmpty(conyugeData) && 
      conyugeData.tipoDocumento && 
      conyugeData.numeroDocumento && 
      conyugeData.nombres && 
      conyugeData.apellidos;

    if (this.editMode && this.prospectoId) {
      // Modo edición - actualizar cliente, paciente y cónyuge
      this.actualizarClienteYPaciente(clienteData, tieneDatosPaciente ? pacienteData : null, tieneDatosConyuge ? conyugeData : null);
    } else {
      // Modo creación - crear cliente y luego paciente/cónyuge si aplica
      this.crearClienteYPaciente(clienteData, tieneDatosPaciente ? pacienteData : null, tieneDatosConyuge ? conyugeData : null);
    }
  }

  private actualizarClienteYPaciente(clienteData: any, pacienteData: any, conyugeData: any): void {
    // Actualizar cliente primero
    this.prospectoApiService.updateClient(Number(this.prospectoId), clienteData).subscribe({
      next: () => {
        let pendingOperations = 0;
        let completedOperations = 0;
        
        // Contar operaciones pendientes
        if (pacienteData) pendingOperations++;
        if (conyugeData) pendingOperations++;
        
        const checkCompletion = () => {
          completedOperations++;
          if (completedOperations === pendingOperations) {
            this.toastService.success('Datos actualizados exitosamente');
            this.volverABandeja();
          }
        };
        
        // Si hay datos de paciente, guardar/actualizar
        if (pacienteData) {
          this.guardarPacienteInterno(pacienteData, checkCompletion);
        }
        
        // Si hay datos de cónyuge, guardar/actualizar
        if (conyugeData) {
          this.guardarConyugeInterno(conyugeData, checkCompletion);
        }
        
        // Si no hay operaciones adicionales
        if (pendingOperations === 0) {
          this.toastService.success('Cliente actualizado exitosamente');
          this.volverABandeja();
        }
      },
      error: (err) => {
        console.error('Error actualizando cliente:', err);
        this.toastService.error('Error al actualizar cliente: ' + (err.error?.message || err.message));
      }
    });
  }

  private crearClienteYPaciente(clienteData: any, pacienteData: any, conyugeData: any): void {
    // Crear cliente primero
    this.prospectoApiService.createClient(clienteData).subscribe({
      next: (response) => {
        // Actualizar el estado local
        this.editMode = true;
        this.prospectoId = response.id?.toString();
        this.clientId = response.id || null;
        
        // Crear prospecto en el servicio local
        const formData = this.clientForm.value;
        const newProspecto = {
          ...formData,
          id: response.id?.toString() || '',
          contrato: '',
          estado: 'Pendiente',
          documento: `${formData.tipoDocumento}-${formData.numeroDocumento}`,
          asociado: `${formData.nombres} ${formData.apellidos}`,
          programa: '',
          grupo: '',
          ciudad: ''
        };
        this.prospectosService.createProspecto(newProspecto);
        
        // Contar operaciones pendientes
        let pendingOperations = 0;
        let completedOperations = 0;
        
        if (pacienteData && this.clientId) pendingOperations++;
        if (conyugeData && this.clientId) pendingOperations++;
        
        const checkCompletion = () => {
          completedOperations++;
          if (completedOperations === pendingOperations) {
            this.toastService.success('Todos los datos creados exitosamente');
          }
        };
        
        // Si hay datos de paciente, crear
        if (pacienteData && this.clientId) {
          this.guardarPacienteInterno(pacienteData, checkCompletion);
        }
        
        // Si hay datos de cónyuge, crear
        if (conyugeData && this.clientId) {
          this.guardarConyugeInterno(conyugeData, checkCompletion);
        }
        
        // Si no hay operaciones adicionales
        if (pendingOperations === 0) {
          this.toastService.success('Cliente creado exitosamente');
        }
      },
      error: (err) => {
        console.error('Error creando cliente:', err);
        this.toastService.error('Error al crear cliente: ' + (err.error?.message || err.message));
      }
    });
  }

  private guardarPacienteInterno(pacienteData: any, callback: () => void): void {
    if (!this.clientId) {
      console.error('No hay clientId para guardar paciente');
      return;
    }

    const pacienteToSave: PacienteData = {
      tipoDocumento: pacienteData.tipoDocumento,
      numeroDocumento: pacienteData.numeroDocumento,
      nombres: pacienteData.nombres,
      apellidos: pacienteData.apellidos,
      sexo: pacienteData.sexo,
      telefono: pacienteData.telefono,
      correo: pacienteData.correo,
      departamento: pacienteData.departamento,
      provincia: pacienteData.provincia,
      distrito: pacienteData.distrito,
      direccion: pacienteData.direccion
    };

    if (this.pacienteEditMode && this.pacienteId) {
      // Actualizar paciente existente
      console.log('[COMPONENT] Actualizando paciente:', {
        clientId: this.clientId,
        pacienteId: this.pacienteId,
        sexo: pacienteToSave.sexo,
        data: pacienteToSave
      });
      
      this.pacientesService.actualizarPaciente(this.clientId, this.pacienteId, pacienteToSave).subscribe({
        next: (response) => {
          console.log('[COMPONENT] Response recibida:', {
            sexo: response.sexo,
            fullResponse: response
          });
          
          // Actualizar el formulario con los datos actualizados del backend
          const pacienteForm = this.clientForm.get('paciente');
          const newValues = {
            tipoDocumento: response.tipoDocumento,
            numeroDocumento: response.numeroDocumento,
            nombres: response.nombres,
            apellidos: response.apellidos,
            sexo: response.sexo,
            telefono: response.telefono,
            correo: response.correo,
            departamento: response.departamento,
            provincia: response.provincia,
            distrito: response.distrito,
            direccion: response.direccion
          };
          
          console.log('[COMPONENT] Actualizando formulario con:', {
            sexo: newValues.sexo,
            allValues: newValues
          });
          
          pacienteForm?.patchValue(newValues, { emitEvent: true });
          pacienteForm?.updateValueAndValidity();
          
          console.log('[COMPONENT] Valor del formulario después de patchValue:', {
            sexo: pacienteForm?.get('sexo')?.value,
            allFormValues: pacienteForm?.value
          });
          
          callback();
        },
        error: (error) => {
          console.error('Error actualizando paciente:', error);
          alert('Error al actualizar paciente: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Crear nuevo paciente
      this.pacientesService.crearPaciente(this.clientId, pacienteToSave).subscribe({
        next: (response) => {
          this.pacienteId = response.id || null;
          this.pacienteEditMode = true;
          // Actualizar el formulario con los datos del backend
          this.clientForm.get('paciente')?.patchValue({
            tipoDocumento: response.tipoDocumento,
            numeroDocumento: response.numeroDocumento,
            nombres: response.nombres,
            apellidos: response.apellidos,
            sexo: response.sexo,
            telefono: response.telefono,
            correo: response.correo,
            departamento: response.departamento,
            provincia: response.provincia,
            distrito: response.distrito,
            direccion: response.direccion
          });
          // Recargar la lista de pacientes
          this.loadExistingPacientes();
          callback();
        },
        error: (error) => {
          console.error('Error creando paciente:', error);
          alert('Error al crear paciente: ' + (error.error?.message || error.message));
        }
      });
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
    console.log('navigateNext llamado. ClientId actual:', this.clientId);
    if (!this.clientId) {
      alert('Debe guardar los datos del cliente antes de continuar');
      return;
    }
    
    // Navegar con el clientId en query params
    console.log('Navegando a datos-clinica con id:', this.clientId);
    this.router.navigate(['/dashboard/nuevo-prospecto/datos-clinica'], {
      queryParams: { id: this.clientId }
    });
  }

  /**
   * Carga los datos de un paciente en el formulario
   */
  private loadPacienteData(paciente: PacienteData): void {
    // Cargar ubicación del paciente
    if (paciente.departamento) {
      this.locationService.getProvinces(paciente.departamento).subscribe(provincias => {
        this.pacienteProvincias = provincias;
        
        if (paciente.provincia) {
          this.locationService.getDistricts(paciente.provincia).subscribe(distritos => {
            this.pacienteDistritos = distritos;
          });
        }
      });
    }

    // Llenar el formulario
    this.clientForm.get('paciente')?.patchValue({
      tipoDocumento: paciente.tipoDocumento,
      numeroDocumento: paciente.numeroDocumento,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      sexo: paciente.sexo,
      telefono: paciente.telefono,
      correo: paciente.correo,
      departamento: paciente.departamento,
      provincia: paciente.provincia,
      distrito: paciente.distrito,
      direccion: paciente.direccion
    });
  }

  /**
   * Carga la lista de pacientes existentes para un cliente
   */
  private loadExistingPacientes(): void {
    if (!this.clientId) return;

    this.pacientesService.getPacientesByClientId(this.clientId).subscribe({
      next: (pacientes) => {
        this.existingPacientes = pacientes;
        
        // Si hay pacientes existentes, cargar el primero por defecto
        if (pacientes.length > 0) {
          const primerPaciente = pacientes[0];
          this.pacienteId = primerPaciente.id || null;
          this.pacienteEditMode = true;
          this.loadPacienteData(primerPaciente);
          this.isPacienteExpanded = true;
        }
      },
      error: (error) => {
        console.error('Error cargando pacientes existentes:', error);
      }
    });
  }

  /**
   * Carga el cónyuge existente para un cliente
   */
  private loadExistingConyuge(): void {
    if (!this.clientId) return;

    this.conyugeService.getConyugeByClientId(this.clientId).subscribe({
      next: (conyuge) => {
        if (conyuge) {
          this.conyugeEditMode = true;
          this.loadConyugeData(conyuge);
          this.isConyugueExpanded = true;
        }
      },
      error: (error) => {
        console.error('Error cargando cónyuge existente:', error);
      }
    });
  }

  /**
   * Carga los datos de un cónyuge en el formulario
   */
  private loadConyugeData(conyuge: ConyugeData): void {
    this.clientForm.get('conyugue')?.patchValue({
      tipoDocumento: conyuge.tipoDocumento,
      numeroDocumento: conyuge.numeroDocumento,
      nombres: conyuge.nombres,
      apellidos: conyuge.apellidos,
      correo: conyuge.correo,
      telefono: conyuge.telefono
    });
  }

  /**
   * Guarda o actualiza un cónyuge
   */
  private guardarConyugeInterno(conyugeData: any, callback: () => void): void {
    if (!this.clientId) {
      console.error('No hay clientId para guardar cónyuge');
      return;
    }

    const conyugeToSave: ConyugeData = {
      tipoDocumento: conyugeData.tipoDocumento,
      numeroDocumento: conyugeData.numeroDocumento,
      nombres: conyugeData.nombres,
      apellidos: conyugeData.apellidos,
      correo: conyugeData.correo,
      telefono: conyugeData.telefono
    };

    if (this.conyugeEditMode) {
      // Actualizar cónyuge existente
      console.log('[COMPONENT] Actualizando cónyuge:', {
        clientId: this.clientId,
        data: conyugeToSave
      });
      
      this.conyugeService.actualizarConyuge(this.clientId, conyugeToSave).subscribe({
        next: (response) => {
          console.log('[COMPONENT] Cónyuge actualizado:', response);
          
          // Actualizar el formulario con los datos del backend
          this.clientForm.get('conyugue')?.patchValue({
            tipoDocumento: response.tipoDocumento,
            numeroDocumento: response.numeroDocumento,
            nombres: response.nombres,
            apellidos: response.apellidos,
            correo: response.correo,
            telefono: response.telefono
          }, { emitEvent: true });
          
          callback();
        },
        error: (error) => {
          console.error('Error actualizando cónyuge:', error);
          alert('Error al actualizar cónyuge: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Crear nuevo cónyuge
      console.log('[COMPONENT] Creando cónyuge:', {
        clientId: this.clientId,
        data: conyugeToSave
      });
      
      this.conyugeService.crearConyuge(this.clientId, conyugeToSave).subscribe({
        next: (response) => {
          console.log('[COMPONENT] Cónyuge creado:', response);
          this.conyugeEditMode = true;
          
          // Actualizar el formulario con los datos del backend
          this.clientForm.get('conyugue')?.patchValue({
            tipoDocumento: response.tipoDocumento,
            numeroDocumento: response.numeroDocumento,
            nombres: response.nombres,
            apellidos: response.apellidos,
            correo: response.correo,
            telefono: response.telefono
          }, { emitEvent: true });
          
          callback();
        },
        error: (error) => {
          console.error('Error creando cónyuge:', error);
          alert('Error al crear cónyuge: ' + (error.error?.message || error.message));
        }
      });
    }
  }

}
