import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocationService, Department, Province, District } from '@app/core/services/location.service';
import { ProspectoApiService, ClienteData } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto-titular',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prospecto-titular.html',
  styleUrl: '../prospecto.scss',
})
export class ProspectoTitular implements OnInit, OnDestroy {
  @Input() initialData?: ClienteData;
  @Output() dataSaved = new EventEmitter<ClienteData>();
  @Output() dataUpdated = new EventEmitter<ClienteData>();

  clientForm!: FormGroup;
  submitted = false;
  isLoading = false;
  editMode = false;

  // Control de secciones expandibles
  isTitularExpanded = true;
  isModeloExpanded = true;

  // Location data
  departamentos: Department[] = [];
  provincias: Province[] = [];
  distritos: District[] = [];
  selectedDepartamentoId?: string;
  selectedProvinciaId?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private prospectoApiService: ProspectoApiService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadDepartments();
    
    if (this.initialData) {
      this.loadInitialData(this.initialData);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDepartments() {
    this.locationService.getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departamentos = departments;
        },
        error: (error) => {
          console.error('Error loading departments:', error);
        }
      });
  }

  private loadInitialData(data: ClienteData) {
    this.editMode = true;
    
    // Wait for departments to load, then load provinces and districts
    if (this.departamentos.length > 0) {
      this.loadLocationData(data);
    } else {
      // Wait for departments to be loaded
      this.locationService.getDepartments()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (departments) => {
            this.departamentos = departments;
            this.loadLocationData(data);
          }
        });
    }

    // Patch form values
    this.clientForm.patchValue({
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      nombres: data.nombres,
      apellidos: data.apellidos,
      estadoCivil: data.estadoCivil,
      fechaNacimiento: data.fechaNacimiento,
      sexo: data.sexo,
      correo: data.correo,
      telefono: data.telefono,
      telefono2: data.telefono2 || '',
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      direccion: data.direccion,
      tasaExperian: data.tasaExperian || '',
      nuevaTasa: data.nuevaTasa || '',
      tasaAdicional: data.tasaAdicional || '',
      tasaFinal: data.tasaFinal || ''
    });
  }

  private loadLocationData(data: ClienteData) {
    // Find department by name
    const dept = this.departamentos.find(d => d.nombre === data.departamento);
    if (dept) {
      this.selectedDepartamentoId = dept.id;
      this.loadProvinces(dept.id, () => {
        const prov = this.provincias.find(p => p.nombre === data.provincia);
        if (prov) {
          this.selectedProvinciaId = prov.id;
          this.loadDistricts(prov.id);
        }
      });
    }
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      estadoCivil: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9,12}$')]],
      telefono2: ['', Validators.pattern('^[0-9]{9,12}$')],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      tasaExperian: ['', Validators.min(0)],
      nuevaTasa: ['', Validators.min(0)],
      tasaAdicional: ['', Validators.min(0)],
      tasaFinal: ['', [Validators.required, Validators.min(0)]]
    });
  }

  get f() { return this.clientForm.controls; }

  onDepartamentoChange(): void {
    const deptName = this.clientForm.get('departamento')?.value;
    const dept = this.departamentos.find(d => d.nombre === deptName);
    
    if (dept) {
      this.selectedDepartamentoId = dept.id;
      this.loadProvinces(dept.id);
      this.clientForm.patchValue({
        provincia: '',
        distrito: ''
      });
      this.provincias = [];
      this.distritos = [];
    }
  }

  private loadProvinces(departamentoId: string, callback?: () => void) {
    this.locationService.getProvinces(departamentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provinces) => {
          this.provincias = provinces;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading provinces:', error);
        }
      });
  }

  onProvinciaChange(): void {
    const provName = this.clientForm.get('provincia')?.value;
    const prov = this.provincias.find(p => p.nombre === provName);
    
    if (prov) {
      this.selectedProvinciaId = prov.id;
      this.loadDistricts(prov.id);
      this.clientForm.patchValue({
        distrito: ''
      });
    }
  }

  private loadDistricts(provinciaId: string) {
    this.locationService.getDistricts(provinciaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (districts) => {
          this.distritos = districts;
        },
        error: (error) => {
          console.error('Error loading districts:', error);
        }
      });
  }

  toggleTitular(): void {
    this.isTitularExpanded = !this.isTitularExpanded;
  }

  toggleModelo(): void {
    this.isModeloExpanded = !this.isModeloExpanded;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.clientForm.invalid) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isLoading = true;
    const formData = this.clientForm.value;
    const clienteData: ClienteData = {
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      estadoCivil: formData.estadoCivil,
      fechaNacimiento: formData.fechaNacimiento,
      sexo: formData.sexo,
      correo: formData.correo,
      telefono: formData.telefono,
      telefono2: formData.telefono2,
      departamento: formData.departamento,
      provincia: formData.provincia,
      distrito: formData.distrito,
      direccion: formData.direccion,
      tasaExperian: formData.tasaExperian ? parseFloat(formData.tasaExperian) : undefined,
      nuevaTasa: formData.nuevaTasa ? parseFloat(formData.nuevaTasa) : undefined,
      tasaAdicional: formData.tasaAdicional ? parseFloat(formData.tasaAdicional) : undefined,
      tasaFinal: formData.tasaFinal ? parseFloat(formData.tasaFinal) : undefined
    };

    if (this.editMode) {
      this.prospectoApiService.updateClient(clienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.dataUpdated.emit(clienteData);
            alert('Titular actualizado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating client:', error);
            alert('Error al actualizar el titular');
          }
        });
    } else {
      this.prospectoApiService.createClient(clienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.editMode = true;
            this.dataSaved.emit(clienteData);
            alert('Titular guardado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating client:', error);
            alert('Error al guardar el titular');
          }
        });
    }
  }
}
