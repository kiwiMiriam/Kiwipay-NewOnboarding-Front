import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  LocationService,
  Department,
  Province,
  District,
} from '@app/core/services/location.service';
import {
  ProspectoApiService,
  AvalistaData,
  DocumentoData,
} from '@app/core/services/prospecto-api.service';
import {
  DocumentoEstado,
  DocumentTableComponent,
} from '@src/app/shared/components/documentTable/documentTable.component';

@Component({
  selector: 'app-prospecto-aval',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DocumentTableComponent],
  templateUrl: './prospecto-aval.html',
  styleUrls: ['../prospecto.scss'],
})
export class ProspectoAval implements OnInit, OnDestroy, OnChanges {
  @Input() initialData?: AvalistaData;
  @Input() clientId?: number;
  @Input() documentos?: DocumentoData[];
  @Output() dataSaved = new EventEmitter<AvalistaData>();
  @Output() dataUpdated = new EventEmitter<AvalistaData>();
  @Output() documentosUpdated = new EventEmitter<DocumentoData[]>();

  public clientForm!: FormGroup;
  public submitted = false;
  public isLoading = false;
  public editMode = false;

  // Control de secciones expandibles
  public isAvalistaExpanded = false;

  // Location data
  public departamentos: Department[] = [];
  public avalistaProvincias: Province[] = [];
  public avalistaDistritos: District[] = [];
  public selectedDepartamentoId?: string;
  public selectedProvinciaId?: string;

  // Documentos
  public documentosList: DocumentoData[] = [];
  public documentosLoading = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private prospectoApiService: ProspectoApiService
  ) {
    this.initForm();
  }

  // Manejadores de eventos para la tabla de documentos
  public onDocumentoSubir(event: { documento: DocumentoData; archivo: File }): void {
    this.documentosLoading = true;
    const updatedDocumentos = [...this.documentosList];
    const index = updatedDocumentos.findIndex((doc) => doc.id === event.documento.id);

    if (index !== -1) {
      const formData = new FormData();
      formData.append('archivo', event.archivo);

      // Simular la carga del archivo y actualizar el documento
      const updatedDoc: DocumentoData = {
        ...event.documento,
        url: URL.createObjectURL(event.archivo),
        fechaCarga: new Date().toISOString(),
        estadoRevision: DocumentoEstado.Pendiente,
      };

      updatedDocumentos[index] = updatedDoc;
      this.prospectoApiService
        .updateDocumentos(updatedDocumentos)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.documentosLoading = false;
            this.documentosList = updatedDocumentos;
          },
          error: (error: Error) => {
            this.documentosLoading = false;
            console.error('Error al subir documento:', error);
            alert('Error al subir el documento');
          },
        });
    }
  }

  public onDocumentoDescargar(documento: DocumentoData): void {
    if (documento.url) {
      const link = document.createElement('a');
      link.href = documento.url;
      link.download = documento.nombre || 'documento';
      link.click();
    } else {
      console.warn('El documento no tiene URL para descargar');
    }
  }

  public onDocumentoAprobar(event: { documento: DocumentoData; comentario: string }): void {
    this.documentosLoading = true;
    const updatedDocumentos = [...this.documentosList];
    const index = updatedDocumentos.findIndex((doc) => doc.id === event.documento.id);

    if (index !== -1) {
      const updatedDoc: DocumentoData = {
        ...event.documento,
        estadoRevision: DocumentoEstado.Aprobado,
        comentario: event.comentario,
        fechaRevision: new Date().toISOString(),
      };

      updatedDocumentos[index] = updatedDoc;
      this.prospectoApiService
        .updateDocumentos(updatedDocumentos)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.documentosLoading = false;
            this.documentosList = updatedDocumentos;
          },
          error: (error: Error) => {
            this.documentosLoading = false;
            console.error('Error al aprobar documento:', error);
            alert('Error al aprobar el documento');
          },
        });
    }
  }

  public onDocumentoRechazar(event: { documento: DocumentoData; comentario: string }): void {
    this.documentosLoading = true;
    const updatedDocumentos = [...this.documentosList];
    const index = updatedDocumentos.findIndex((doc) => doc.id === event.documento.id);

    if (index !== -1) {
      const updatedDoc: DocumentoData = {
        ...event.documento,
        estadoRevision: DocumentoEstado.Rechazado,
        comentario: event.comentario,
        fechaRevision: new Date().toISOString(),
      };

      updatedDocumentos[index] = updatedDoc;
      this.prospectoApiService
        .updateDocumentos(updatedDocumentos)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.documentosLoading = false;
            this.documentosList = updatedDocumentos;
          },
          error: (error: Error) => {
            this.documentosLoading = false;
            console.error('Error al rechazar documento:', error);
            alert('Error al rechazar el documento');
          },
        });
    }
  }

  public ngOnInit(): void {
    this.loadDepartments();
    
    // Si hay clientId, cargar aval desde el backend
    if (this.clientId) {
      this.loadGuarantorFromBackend(this.clientId);
    } else if (this.initialData) {
      this.isAvalistaExpanded = true;
      this.editMode = true;
      this.loadInitialData(this.initialData);
    }
    
    if (this.documentos && this.documentos.length) {
      this.documentosList = [...this.documentos];
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId'] && !changes['clientId'].firstChange) {
      const newClientId = changes['clientId'].currentValue;
      if (newClientId) {
        this.loadGuarantorFromBackend(newClientId);
      }
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar aval desde el backend
   */
  private loadGuarantorFromBackend(clientId: number): void {
    this.isLoading = true;
    console.log('Loading guarantor for clientId:', clientId);
    
    this.prospectoApiService.getGuarantor(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guarantor) => {
          this.isLoading = false;
          if (guarantor) {
            console.log('Guarantor found:', guarantor);
            this.editMode = true;
            this.isAvalistaExpanded = true;
            this.loadInitialData(guarantor);
          } else {
            console.log('No guarantor found for this client');
            this.editMode = false;
            this.isAvalistaExpanded = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading guarantor:', error);
          this.editMode = false;
          this.isAvalistaExpanded = false;
        }
      });
  }

  private loadDepartments(): void {
    this.locationService
      .getDepartments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (departments) => {
          this.departamentos = departments;
        },
        error: (error) => {
          console.error('Error loading departments:', error);
        },
      });
  }

  private loadInitialData(data: AvalistaData): void {
    if (this.departamentos.length > 0) {
      this.loadLocationData(data);
    } else {
      this.locationService
        .getDepartments()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (departments) => {
            this.departamentos = departments;
            this.loadLocationData(data);
          },
          error: (error) => {
            console.error('Error cargando departamentos:', error);
          },
        });
    }
  }

  private patchAvalistaForm(data: AvalistaData): void {
    const avalistaFormObject = this.clientForm.get('avalista');
    if (avalistaFormObject) {
      // Mapear desde la estructura del backend a los campos del formulario
      avalistaFormObject.patchValue({
        tipoDocumento: data.documentType || data.tipoDocumento || '',
        numeroDocumento: data.documentNumber || data.numeroDocumento || '',
        estadoCivil: data.maritalStatus || data.estadoCivil || '',
        nombres: data.firstNames || data.nombres || '',
        apellidos: data.lastNames || data.apellidos || '',
        sexo: data.gender || data.sexo || '',
        telefono: data.phone || data.telefono || '',
        correo: data.email || data.correo || '',
        ingresos: data.monthlyIncome || data.ingresos || '',
        departamento: data.address?.departmentId || data.departamento || '',
        provincia: data.address?.provinceId || data.provincia || '',
        distrito: data.address?.districtId || data.distrito || '',
        direccion: data.address?.line1 || data.direccion || ''
      });
    }
    console.log('Form patched with guarantor data:', avalistaFormObject?.value);
  }

  private loadLocationData(data: AvalistaData): void {
    // Usar address object del backend o campos planos de compatibilidad
    const deptId = data.address?.departmentId || data.departamento;
    if (deptId) {
      const dept = this.departamentos.find((d) => d.id === deptId || d.name === deptId);
      if (dept) {
        this.selectedDepartamentoId = dept.id;
        this.loadProvinces(dept.id, () => {
          const provId = data.address?.provinceId || data.provincia;
          if (provId) {
            const prov = this.avalistaProvincias.find((p) => p.id === provId || p.name === provId);
            if (prov) {
              this.selectedProvinciaId = prov.id;
              this.loadDistricts(prov.id, () => {
                // Patch form after all location data is loaded
                this.patchAvalistaForm(data);
              });
            }
          } else {
            this.patchAvalistaForm(data);
          }
        });
      }
    } else {
      this.patchAvalistaForm(data);
    }
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      avalista: this.fb.group({
        tipoDocumento: ['', [Validators.required]],
        numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
        estadoCivil: ['', [Validators.required]],
        nombres: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: ['', [Validators.required, Validators.minLength(2)]],
        sexo: ['', [Validators.required]],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9,12}$')]],
        correo: ['', [Validators.email]],
        ingresos: ['', [Validators.required, Validators.min(0)]],
        departamento: ['', [Validators.required]],
        provincia: ['', [Validators.required]],
        distrito: ['', [Validators.required]],
        direccion: ['', [Validators.required, Validators.minLength(5)]],
      }),
    });
  }

  public get f() {
    return (this.clientForm.get('avalista') as FormGroup).controls;
  }

  public get avalistaForm() {
    return this.clientForm.get('avalista') as FormGroup;
  }

  public onAvalistaDepartamentoChange(): void {
    const deptId = this.avalistaForm.get('departamento')?.value;
    
    if (deptId) {
      this.selectedDepartamentoId = deptId;
      this.loadProvinces(deptId);
      this.avalistaForm.patchValue({
        provincia: '',
        distrito: '',
      });
      this.avalistaProvincias = [];
      this.avalistaDistritos = [];
    }
  }

  private loadProvinces(departamentoId: string, callback?: () => void): void {
    this.locationService
      .getProvinces(departamentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provinces) => {
          this.avalistaProvincias = provinces;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading provinces:', error);
        },
      });
  }

  public onAvalistaProvinciaChange(): void {
    const provId = this.avalistaForm.get('provincia')?.value;
    
    if (provId) {
      this.selectedProvinciaId = provId;
      this.loadDistricts(provId);
      this.avalistaForm.patchValue({
        distrito: '',
      });
    }
  }

  private loadDistricts(provinciaId: string, callback?: () => void): void {
    this.locationService
      .getDistricts(provinciaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (districts) => {
          this.avalistaDistritos = districts;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading districts:', error);
        },
      });
  }

  public toggleAvalista(): void {
    this.isAvalistaExpanded = !this.isAvalistaExpanded;
  }

  public onSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.submitted = true;

    // Validate only if form has values
    const formValue = this.avalistaForm.value;
    const hasValues = Object.values(formValue).some(v => v !== '' && v !== null);

    if (hasValues && this.avalistaForm.invalid) {
      console.warn('Form is invalid:', this.avalistaForm.errors);
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!hasValues) {
      console.log('Form has no values, skipping submission');
      return;
    }

    if (!this.clientId) {
      console.error('No clientId available for guarantor submission');
      return;
    }

    this.isLoading = true;
    const formData = this.avalistaForm.value;
    
    // Preparar datos en formato del backend
    const avalistaData: AvalistaData = {
      documentType: formData.tipoDocumento || undefined,
      documentNumber: formData.numeroDocumento || undefined,
      monthlyIncome: formData.ingresos ? parseFloat(formData.ingresos) : undefined,
      firstNames: formData.nombres || undefined,
      lastNames: formData.apellidos || undefined,
      gender: formData.sexo || undefined,
      maritalStatus: formData.estadoCivil || undefined,
      email: formData.correo || undefined,
      phone: formData.telefono || undefined,
      address: {
        departmentId: formData.departamento || undefined,
        provinceId: formData.provincia || undefined,
        districtId: formData.distrito || undefined,
        line1: formData.direccion || undefined
      }
    };

    console.log('=== DATOS DEL AVAL A ENVIAR ===');
    console.log('Client ID:', this.clientId);
    console.log('Guarantor Data:', avalistaData);

    // Siempre usar PUT (crea o actualiza según exista o no)
    this.prospectoApiService.updateGuarantor(this.clientId, avalistaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Guarantor saved successfully:', response);
          
          if (this.editMode) {
            this.dataUpdated.emit(response);
            alert('Aval actualizado exitosamente');
          } else {
            this.editMode = true;
            this.dataSaved.emit(response);
            alert('Aval registrado exitosamente');
          }
          
          // Recargar los datos actualizados
          this.loadGuarantorFromBackend(this.clientId!);
          
          // Si hay documentos, actualizarlos también
          if (this.documentosList.length) {
            this.prospectoApiService
              .updateDocumentos(this.documentosList)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.documentosUpdated.emit(this.documentosList);
                },
                error: (error) => {
                  console.error('Error actualizando documentos:', error);
                  alert('Error al actualizar los documentos');
                },
              });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en operación de aval:', error);
          alert(`Error al ${this.editMode ? 'actualizar' : 'registrar'} el aval`);
        }
      });
  }
}
