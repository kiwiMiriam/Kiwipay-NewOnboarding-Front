import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
export class ProspectoPaciente implements OnInit, OnDestroy, OnChanges {
  @Input() initialData?: PacienteData;
  @Input() clientId?: number;
  @Output() dataSaved = new EventEmitter<PacienteData>();
  @Output() dataUpdated = new EventEmitter<PacienteData>();

  clientForm!: FormGroup;
  submitted = false;
  isLoading = false;
  editMode = false;
  patientId?: number;

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
    
    // Si hay clientId, cargar paciente desde el backend
    if (this.clientId) {
      this.loadPatientFromBackend(this.clientId);
    } else if (this.initialData) {
      this.isPacienteExpanded = true;
      this.editMode = true;
      this.loadInitialData(this.initialData);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      const newClientId = changes['clientId'].currentValue;
      console.log('ProspectoPaciente.ngOnChanges clientId:', newClientId);
      if (newClientId) {
        this.loadPatientFromBackend(newClientId);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar paciente desde el backend
   */
  private loadPatientFromBackend(clientId: number): void {
    this.isLoading = true;
    console.log('Loading patients for clientId:', clientId);
    
    this.prospectoApiService.getPatients(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          console.log('Patients loaded from backend:', patients);
          
          if (patients && patients.length > 0) {
            // Tomar el primer paciente
            const patient = patients[0];
            this.patientId = patient.id;
            this.editMode = true;
            this.isPacienteExpanded = true;
            this.loadInitialData(patient);
          } else {
            // No hay paciente, formulario vacío
            this.editMode = false;
            this.patientId = undefined;
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.isLoading = false;
          // Si hay error 404, significa que no hay pacientes
          if (error.status === 404) {
            this.editMode = false;
            this.patientId = undefined;
          }
        }
      });
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
    console.log('Loading initial patient data:', data);
    
    // Actualizar patientId si viene del backend
    if (data.id) {
      this.patientId = data.id;
      this.editMode = true;
    }
    
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

    // Patch form values - mapear desde la estructura del backend
    this.pacienteForm.patchValue({
      tipoDocumento: data.documentType || data.tipoDocumento || '',
      numeroDocumento: data.documentNumber || data.numeroDocumento || '',
      nombres: data.firstNames || data.nombres || '',
      apellidos: data.lastNames || data.apellidos || '',
      sexo: data.gender || data.sexo || '',
      telefono: data.phone || data.telefono || '',
      correo: data.email || data.correo || '',
      departamento: data.address?.departmentId || data.departamento || '',
      provincia: data.address?.provinceId || data.provincia || '',
      distrito: data.address?.districtId || data.distrito || '',
      direccion: data.address?.line1 || data.direccion || ''
    });
    
    console.log('Form value after patch:', this.pacienteForm.value);
  }

  private loadLocationData(data: PacienteData) {
    const deptId = data.address?.departmentId || data.departamento;
    if (deptId) {
      // Try to find by ID first, then by name for backwards compatibility
      const dept = this.departamentos.find(d => d.id === deptId || d.name === deptId);
      if (dept) {
        this.selectedDepartamentoId = dept.id;
        this.loadProvinces(dept.id, () => {
          const provId = data.address?.provinceId || data.provincia;
          if (provId) {
            const prov = this.provincias.find(p => p.id === provId || p.name === provId);
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

    if (!this.clientId) {
      alert('No se ha proporcionado clientId para guardar el paciente');
      return;
    }

    this.isLoading = true;
    const formData = this.pacienteForm.value;
    
    // Preparar datos en formato del backend
    const pacienteData: PacienteData = {
      documentType: formData.tipoDocumento || undefined,
      documentNumber: formData.numeroDocumento || undefined,
      firstNames: formData.nombres || undefined,
      lastNames: formData.apellidos || undefined,
      gender: formData.sexo || undefined,
      phone: formData.telefono || undefined,
      email: formData.correo || undefined,
      address: {
        departmentId: formData.departamento || undefined,
        provinceId: formData.provincia || undefined,
        districtId: formData.distrito || undefined,
        line1: formData.direccion || undefined
      }
    };

    console.log('=== DATOS DEL PACIENTE A ENVIAR ===');
    console.log('Edit Mode:', this.editMode);
    console.log('Client ID:', this.clientId);
    console.log('Patient ID:', this.patientId);
    console.log('Patient Data:', pacienteData);

    if (this.editMode && this.patientId) {
      // Actualizar paciente existente
      console.log('Updating existing patient...');
      
      this.prospectoApiService.updatePatient(this.clientId, this.patientId, pacienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Patient updated successfully:', response);
            this.isLoading = false;
            this.submitted = false;
            
            alert('Datos del paciente actualizados exitosamente');
            this.dataUpdated.emit(response);
          },
          error: (error) => {
            console.error('Error updating patient:', error);
            this.isLoading = false;
            alert('Error al actualizar el paciente: ' + (error.error?.message || error.message));
          }
        });
    } else {
      // Crear nuevo paciente
      console.log('Creating new patient...');
      
      this.prospectoApiService.createPatient(this.clientId, pacienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Patient created successfully:', response);
            this.isLoading = false;
            this.submitted = false;
            this.editMode = true;
            
            // Guardar el ID del paciente retornado
            if (response && response.id) {
              this.patientId = response.id;
            }
            
            alert('Datos del paciente guardados exitosamente');
            this.dataSaved.emit(response);
          },
          error: (error) => {
            console.error('Error creating patient:', error);
            this.isLoading = false;
            alert('Error al guardar el paciente: ' + (error.error?.message || error.message));
          }
        });
    }
  }
}

