import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocationService, Department, Province, District } from '@app/core/services/location.service';
import { ProspectoApiService, PacienteData } from '@app/core/services/prospecto-api.service';

@Component({
  selector: 'app-prospecto-paciente',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prospecto-paciente.html',
  styleUrls: ['../prospecto.scss']
})
export class ProspectoPaciente implements OnInit, OnDestroy {
  @Input() initialData?: PacienteData;
  @Input() clientId?: number;
  @Input() patientId?: number;
  @Output() dataSaved = new EventEmitter<PacienteData>();
  @Output() dataUpdated = new EventEmitter<PacienteData>();

  clientForm!: FormGroup;
  submitted = false;
  isLoading = false;
  editMode = false;

  // Control de secciones expandibles
  isPacienteExpanded = false;

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

  ngOnInit(): void {
    this.loadDepartments();
    
    if (this.initialData) {
      this.isPacienteExpanded = true;
      this.editMode = true;
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

  private loadInitialData(data: PacienteData) {
    // Wait for departments to load
    if (this.departamentos.length > 0) {
      this.loadLocationData(data);
    } else {
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
    this.pacienteForm.patchValue({
      tipoDocumento: data.tipoDocumento || '',
      numeroDocumento: data.numeroDocumento || '',
      nombres: data.nombres || '',
      apellidos: data.apellidos || '',
      sexo: data.sexo || '',
      telefono: data.telefono || '',
      correo: data.correo || '',
      departamento: data.departamento || '',
      provincia: data.provincia || '',
      distrito: data.distrito || '',
      direccion: data.direccion || ''
    });
  }

  private loadLocationData(data: PacienteData) {
    if (data.departamento) {
      // Try to find by ID first, then by name for backwards compatibility
      const dept = this.departamentos.find(d => d.id === data.departamento || d.name === data.departamento);
      if (dept) {
        this.selectedDepartamentoId = dept.id;
        this.loadProvinces(dept.id, () => {
          if (data.provincia) {
            const prov = this.provincias.find(p => p.id === data.provincia || p.name === data.provincia);
            if (prov) {
              this.selectedProvinciaId = prov.id;
              this.loadDistricts(prov.id);
            }
          }
        });
      }
    }
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      paciente: this.fb.group({
        tipoDocumento: [''],
        numeroDocumento: ['', Validators.pattern('^[0-9]{8,12}$')],
        nombres: [''],
        apellidos: [''],
        sexo: [''],
        telefono: ['', Validators.pattern('^[0-9]{9,12}$')],
        correo: ['', Validators.email],
        departamento: [''],
        provincia: [''],
        distrito: [''],
        direccion: ['']
      })
    });
  }

  get pacienteForm() {
    return this.clientForm.get('paciente') as FormGroup;
  }

  get f() {
    return this.pacienteForm.controls;
  }

  onPacienteDepartamentoChange(): void {
    const deptId = this.pacienteForm.get('departamento')?.value;
    
    if (deptId) {
      this.selectedDepartamentoId = deptId;
      this.loadProvinces(deptId);
      this.pacienteForm.patchValue({
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

  onPacienteProvinciaChange(): void {
    const provId = this.pacienteForm.get('provincia')?.value;
    
    if (provId) {
      this.selectedProvinciaId = provId;
      this.loadDistricts(provId);
      this.pacienteForm.patchValue({
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

  togglePaciente(): void {
    this.isPacienteExpanded = !this.isPacienteExpanded;
  }

  onSubmit(): void {
    this.submitted = true;

    // Validate only if form has values
    const formValue = this.pacienteForm.value;
    const hasValues = Object.values(formValue).some(v => v !== '' && v !== null);

    if (hasValues && this.pacienteForm.invalid) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!hasValues) {
      return; // Don't save if form is empty
    }

    this.isLoading = true;
    const formData = this.pacienteForm.value;
    const pacienteData: PacienteData = {
      tipoDocumento: formData.tipoDocumento || undefined,
      numeroDocumento: formData.numeroDocumento || undefined,
      nombres: formData.nombres || undefined,
      apellidos: formData.apellidos || undefined,
      sexo: formData.sexo || undefined,
      telefono: formData.telefono || undefined,
      correo: formData.correo || undefined,
      departamento: formData.departamento || undefined,
      provincia: formData.provincia || undefined,
      distrito: formData.distrito || undefined,
      direccion: formData.direccion || undefined
    };

    if (this.editMode && this.clientId && this.patientId) {
      this.prospectoApiService.updatePatient(this.clientId, this.patientId, pacienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.dataUpdated.emit(pacienteData);
            alert('Paciente actualizado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating patient:', error);
            alert('Error al actualizar el paciente');
          }
        });
    } else if (this.clientId) {
      this.prospectoApiService.createPatient(this.clientId, pacienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            this.editMode = true;
            this.isPacienteExpanded = true;
            this.dataSaved.emit(pacienteData);
            alert('Paciente guardado exitosamente');
            // Si el backend retorna el id del paciente, lo puedes guardar aquí
            if (res && res.id) {
              this.patientId = res.id;
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating patient:', error);
            alert('Error al guardar el paciente');
          }
        });
    } else {
      alert('No se ha proporcionado clientId para guardar el paciente');
      this.isLoading = false;
    }
  }
}

