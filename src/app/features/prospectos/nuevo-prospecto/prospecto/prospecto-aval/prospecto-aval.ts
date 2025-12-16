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
} from '@src/app/shared/components/documentTable/documentTable.component';
import {
  GuarantorSpouseService,
  GuarantorSpouseData,
  CreateGuarantorSpouseRequest,
  UpdateGuarantorSpouseRequest
} from '@app/core/services/guarantor-spouse.service';
import { GuarantorDocumentService } from '@app/core/services/guarantor-document.service';

@Component({
  selector: 'app-prospecto-aval',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  public isConyugeExpanded = false;

  // Guarantor and spouse data
  public guarantorId?: string;
  public hasGuarantor = false;
  public guarantorSpouse?: GuarantorSpouseData;
  public spouseEditMode = false;
  public isLoadingSpouse = false;
  public spouseForm?: FormGroup;

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
    private prospectoApiService: ProspectoApiService,
    private guarantorSpouseService: GuarantorSpouseService,
    private guarantorDocumentService: GuarantorDocumentService
  ) {
    this.initForm();
    this.initSpouseForm();
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
    
    // Si hay clientId, cargar aval desde el backend y verificar cónyuge
    if (this.clientId) {
      this.loadGuarantorFromBackend(this.clientId);
      this.checkGuarantorExists(); // Verificar si existe aval para mostrar formulario de cónyuge
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
            this.hasGuarantor = true;
            // Asegurar que obtenemos el ID correcto del aval
            this.guarantorId = guarantor.guarantorId?.toString() || guarantor.id?.toString();
            console.log('Guarantor ID set from loadGuarantorFromBackend:', this.guarantorId);
            console.log('Full guarantor response:', guarantor);
            this.loadInitialData(guarantor);
            // Cargar cónyuge si existe y tenemos el guarantorId
            if (this.guarantorId) {
              this.loadGuarantorSpouse();
            }
          } else {
            console.log('No guarantor found for this client');
            this.editMode = false;
            this.isAvalistaExpanded = false;
            this.hasGuarantor = false;
            this.guarantorId = undefined;
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
          
          // Asegurar que capturamos el guarantorId de la respuesta
          this.guarantorId = response.guarantorId?.toString() || response.id?.toString();
          this.hasGuarantor = true;
          console.log('Guarantor ID captured from response:', this.guarantorId);
          console.log('Full response:', response);
          
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

  // ===== MÉTODOS PARA CÓNYUGE DEL AVAL =====

  private initSpouseForm(): void {
    this.spouseForm = this.fb.group({
      tipoDocumento: [''],
      numeroDocumento: [''],
      nombres: [''],
      apellidos: [''],
      correo: [''],
      telefono: ['']
    });
  }

  public toggleConyugeSection(): void {
    this.isConyugeExpanded = !this.isConyugeExpanded;
  }

  private checkGuarantorExists(): void {
    if (!this.clientId) return;

    this.guarantorDocumentService.checkGuarantorExists(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guarantor) => {
          console.log('Guarantor found:', guarantor);
          this.hasGuarantor = true;
          // Asegurar que obtenemos el ID del aval de la respuesta
          this.guarantorId = guarantor.guarantorId?.toString() || guarantor.id?.toString();
          console.log('Guarantor ID set to:', this.guarantorId);
          console.log('Full guarantor response:', guarantor);
          
          if (this.guarantorId) {
            this.loadGuarantorSpouse();
          } else {
            console.error('Guarantor ID not found in response');
          }
        },
        error: (error) => {
          console.log('No guarantor found:', error);
          this.hasGuarantor = false;
          this.guarantorId = undefined;
        }
      });
  }

  private loadGuarantorSpouse(): void {
    if (!this.guarantorId) return;

    this.isLoadingSpouse = true;
    this.guarantorSpouseService.getGuarantorSpouse(this.guarantorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (spouse) => {
          console.log('Spouse found:', spouse);
          this.guarantorSpouse = spouse;
          this.spouseEditMode = true;
          this.patchSpouseForm(spouse);
          this.isLoadingSpouse = false;
        },
        error: (error) => {
          console.log('No spouse found:', error);
          this.guarantorSpouse = undefined;
          this.spouseEditMode = false;
          this.isLoadingSpouse = false;
        }
      });
  }

  private patchSpouseForm(spouse: GuarantorSpouseData): void {
    if (!this.spouseForm) return;

    this.spouseForm.patchValue({
      tipoDocumento: spouse.documentType || '',
      numeroDocumento: spouse.documentNumber || '',
      nombres: spouse.firstNames || '',
      apellidos: spouse.lastNames || '',
      correo: spouse.email || '',
      telefono: spouse.phone || ''
    });
  }

  public submitSpouseForm(): void {
    if (!this.spouseForm) {
      console.error('Spouse form not available');
      alert('Error: Formulario no disponible');
      return;
    }

    if (!this.guarantorId) {
      console.error('Guarantor ID not available. Current guarantorId:', this.guarantorId);
      console.error('Has guarantor:', this.hasGuarantor);
      alert('Error: No se puede guardar el cónyuge porque no se encontró un aval asociado');
      return;
    }

    console.log('Submitting spouse form with guarantorId:', this.guarantorId);
    const formValue = this.spouseForm.value;

    if (this.spouseEditMode) {
      // Actualizar cónyuge existente
      const updateData: UpdateGuarantorSpouseRequest = {
        documentType: formValue.tipoDocumento || undefined,
        documentNumber: formValue.numeroDocumento || undefined,
        firstNames: formValue.nombres || undefined,
        lastNames: formValue.apellidos || undefined,
        email: formValue.correo || undefined,
        phone: formValue.telefono || undefined
      };

      this.isLoadingSpouse = true;
      this.guarantorSpouseService.updateGuarantorSpouse(this.guarantorId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Spouse updated successfully:', response);
            this.guarantorSpouse = response;
            this.isLoadingSpouse = false;
            alert('Información del cónyuge actualizada exitosamente');
          },
          error: (error) => {
            console.error('Error updating spouse:', error);
            this.isLoadingSpouse = false;
            alert('Error al actualizar la información del cónyuge');
          }
        });
    } else {
      // Crear nuevo cónyuge
      const createData: CreateGuarantorSpouseRequest = {
        documentType: formValue.tipoDocumento || '',
        documentNumber: formValue.numeroDocumento || '',
        firstNames: formValue.nombres || '',
        lastNames: formValue.apellidos || '',
        email: formValue.correo || undefined,
        phone: formValue.telefono || undefined
      };

      this.isLoadingSpouse = true;
      this.guarantorSpouseService.createGuarantorSpouse(this.guarantorId, createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Spouse created successfully:', response);
            this.guarantorSpouse = response;
            this.spouseEditMode = true;
            this.isLoadingSpouse = false;
            alert('Cónyuge registrado exitosamente');
          },
          error: (error) => {
            console.error('Error creating spouse:', error);
            this.isLoadingSpouse = false;
            alert('Error al registrar el cónyuge');
          }
        });
    }
  }

  public resetSpouseForm(): void {
    if (!this.spouseForm) return;

    if (this.spouseEditMode && this.guarantorSpouse) {
      // Restaurar valores originales
      this.patchSpouseForm(this.guarantorSpouse);
    } else {
      // Limpiar formulario
      this.spouseForm.reset();
    }
  }
}
