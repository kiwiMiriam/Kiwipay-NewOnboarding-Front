import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
  styleUrls: ['./prospecto-titular.scss', '../prospecto.scss'],
})
export class ProspectoTitular implements OnInit, OnDestroy, OnChanges {
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

    if (this.initialData && Object.keys(this.initialData).length > 0) {
      this.editMode = true;
      this.loadInitialData(this.initialData);
    } else {
      this.editMode = false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialData'] && !changes['initialData'].firstChange) {
      const newData = changes['initialData'].currentValue;
      if (newData && Object.keys(newData).length > 0) {
        this.editMode = true;
        this.loadInitialData(newData);
      }
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

    // Patch form values - mapear desde la estructura del backend
    this.clientForm.patchValue({
      tipoDocumento: data.documentType || data.tipoDocumento,
      numeroDocumento: data.documentNumber || data.numeroDocumento,
      nombres: data.firstNames || data.nombres,
      apellidos: data.lastNames || data.apellidos,
      estadoCivil: data.maritalStatus || data.estadoCivil,
      fechaNacimiento: data.birthDate || data.fechaNacimiento,
      sexo: data.gender || data.sexo,
      correo: data.email || data.correo,
      telefono: data.phone || data.telefono,
      telefono2: (data as any).telefono2 || '',
      departamento: data.address?.departmentId || data.departamento,
      provincia: data.address?.provinceId || data.provincia,
      distrito: data.address?.districtId || data.distrito,
      direccion: data.address?.line1 || data.direccion,
      tasaExperian: (data as any).tasaExperian || '',
      nuevaTasa: (data as any).nuevaTasa || '',
      tasaAdicional: (data as any).tasaAdicional || '',
      tasaFinal: (data as any).tasaFinal || ''
    });
  }

  private loadLocationData(data: ClienteData) {
    // Find department by name - use address.departmentId or fallback to departamento
    const deptId = data.address?.departmentId || data.departamento;
    const dept = this.departamentos.find(d => d.id === deptId || d.name === deptId);
    if (dept) {
      this.selectedDepartamentoId = dept.id;
      this.loadProvinces(dept.id, () => {
        const provId = data.address?.provinceId || data.provincia;
        const prov = this.provincias.find(p => p.id === provId || p.name === provId);
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
      tasaFinal: ['', [Validators.required, Validators.min(0)]],
      resultadoModelo: ['', Validators.required],
      puntajeModelo: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  get f() { return this.clientForm.controls; }

  onDepartamentoChange(): void {
    const deptId = this.clientForm.get('departamento')?.value;
    
    if (deptId) {
      this.selectedDepartamentoId = deptId;
      this.loadProvinces(deptId);
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
    const provId = this.clientForm.get('provincia')?.value;
    
    if (provId) {
      this.selectedProvinciaId = provId;
      this.loadDistricts(provId);
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
      // Campos del backend
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
      },
      // Campos adicionales para compatibilidad
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      estadoCivil: formData.estadoCivil,
      fechaNacimiento: formData.fechaNacimiento,
      sexo: formData.sexo,
      correo: formData.correo,
      telefono: formData.telefono,
      departamento: formData.departamento,
      provincia: formData.provincia,
      distrito: formData.distrito,
      direccion: formData.direccion
    };

    console.log('=== DATOS A ENVIAR ===');
    console.log('Edit Mode:', this.editMode);
    console.log('Client ID:', this.initialData?.id);
    console.log('Client Data:', clienteData);
    console.log('Address:', clienteData.address);

    if (this.editMode && this.initialData?.id) {
      console.log('Updating existing client, ID:', this.initialData.id);
      this.prospectoApiService.updateClient(this.initialData.id, clienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Client updated successfully:', response);
            this.isLoading = false;
            // Update with response data or merge with sent data
            const updatedClient = { ...clienteData, id: this.initialData!.id };
            console.log('Updated client data:', updatedClient);
            this.dataUpdated.emit(updatedClient);
            alert('Titular actualizado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating client:', error);
            console.error('Error details:', error.error);
            alert('Error al actualizar el titular: ' + (error.error?.message || error.message));
          }
        });
    } else {
      console.log('Creating new client...');
      this.prospectoApiService.createClient(clienteData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Client created successfully:', response);
            this.isLoading = false;
            this.editMode = true;
            // Update the client data with the ID returned from backend
            // Backend might return the full object or just { id: number }
            const createdClient = { 
              ...clienteData, 
              id: response?.id || response
            };
            console.log('Created client with ID:', createdClient);
            this.initialData = createdClient;
            this.dataSaved.emit(createdClient);
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
