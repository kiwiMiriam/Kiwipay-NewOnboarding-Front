import {  Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Prospecto, ProspectosService } from '@app/core/services/prospectos.service';
import { NavigationService } from '@src/app/core/services/navigation.service';
import  { ubicacionMap }  from '@app/shared/constants/ubicacionMap';

@Component({
  selector: 'app-prospecto-titular',
  imports: [],
  templateUrl: './prospecto-titular.html',
  styleUrl: '../prospecto.scss',
})
export class ProspectoTitular implements OnInit {
   clientForm!: FormGroup;
  submitted = false;
  editMode = false;
  prospectoId: string | null = null;

 // Control de secciones expandibles
 isTitularExpanded = true;
 isModeloExpanded = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prospectosService: ProspectosService,
    private navigationService: NavigationService
  ) {
    this.initForm();
  }

  ngOnInit() {
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
  ubicacionMap = ubicacionMap;

  // Datos para el paciente (opcional)
  pacienteProvincias: string[] = [];
  pacienteDistritos: string[] = [];


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
  toggleTitular(): void {
    this.isTitularExpanded = !this.isTitularExpanded;
  }
  toggleModelo(): void {
    this.isModeloExpanded = !this.isModeloExpanded;
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

    if (this.editMode && this.prospectoId) {
      // Update existing prospecto
      this.prospectosService.updateProspecto(this.prospectoId, {
        ...formData,
        id: this.prospectoId
      });
    } else {
      // Create new prospecto
      this.prospectosService.createProspecto(formData);
    }
    this.router.navigate(['/bandeja']);
  }

  // Verificar si un objeto tiene todos sus valores vacíos
  private isEmpty(obj: any): boolean {
    if (!obj) return true;
    return Object.values(obj).every(x => x === null || x === '' || x === undefined);
  }

  onCancel(): void {
    if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/bandeja']);
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
