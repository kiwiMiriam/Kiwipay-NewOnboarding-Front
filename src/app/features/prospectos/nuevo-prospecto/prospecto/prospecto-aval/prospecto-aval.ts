import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocationService, Department, Province, District } from '@app/core/services/location.service';
import { ProspectoApiService, AvalistaData } from '@app/core/services/prospecto-api.service';
import { DocumentoEstado, DocumentTableComponent } from "@src/app/shared/components/documentTable/documentTable.component";
import { DocumentoService } from '@app/core/services/documento.service';
import type { DocumentoData } from '@app/core/services/documento.service';

@Component({
  selector: 'app-prospecto-aval',
  imports: [CommonModule, ReactiveFormsModule, DocumentTableComponent],
  templateUrl: './prospecto-aval.html',
  styleUrl: '../prospecto.scss',
})
export class ProspectoAval implements OnInit, OnDestroy {
  @Input() initialData?: AvalistaData;
  @Input() documentos?: DocumentoData[];
  @Output() dataSaved = new EventEmitter<AvalistaData>();
  @Output() dataUpdated = new EventEmitter<AvalistaData>();

  clientForm!: FormGroup;
  submitted = false;
  isLoading = false;
  editMode = false;

  // Control de secciones expandibles
  isAvalistaExpanded = false;

  // Location data
  departamentos: Department[] = [];
  avalistaProvincias: Province[] = [];
  avalistaDistritos: District[] = [];
  selectedDepartamentoId?: string;
  selectedProvinciaId?: string;

  // Documentos
  documentosList: DocumentoData[] = [];
  documentosLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private prospectoApiService: ProspectoApiService,
    private documentoService: DocumentoService
  ) {
    this.initForm();
  }

  // Manejadores de eventos para la tabla de documentos
  onDocumentoSubir(event: { documento: DocumentoData; archivo: File }): void {
    this.documentosLoading = true;
    this.documentoService.subirDocumento(event.documento.id, event.archivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DocumentoData) => {
          this.documentosLoading = false;
          const index = this.documentosList.findIndex(doc => doc.id === event.documento.id);
          if (index !== -1) {
            this.documentosList[index] = { ...this.documentosList[index], ...response };
          }
        },
        error: (error: Error) => {
          this.documentosLoading = false;
          console.error('Error al subir documento:', error);
          alert('Error al subir el documento');
        }
      });
  }

  onDocumentoDescargar(documento: DocumentoData): void {
    this.documentoService.descargarDocumento(documento.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = documento.nombre || 'documento';
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: Error) => {
          console.error('Error al descargar documento:', error);
          alert('Error al descargar el documento');
        }
      });
  }

  onDocumentoAprobar(event: { documento: DocumentoData; comentario: string }): void {
    this.documentosLoading = true;
    this.documentoService.aprobarDocumento(event.documento.id, event.comentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DocumentoData) => {
          this.documentosLoading = false;
          const index = this.documentosList.findIndex(doc => doc.id === event.documento.id);
          if (index !== -1) {
            this.documentosList[index] = { ...this.documentosList[index], ...response };
          }
        },
        error: (error: Error) => {
          this.documentosLoading = false;
          console.error('Error al aprobar documento:', error);
          alert('Error al aprobar el documento');
        }
      });
  }

  onDocumentoRechazar(event: { documento: DocumentoData; comentario: string }): void {
    this.documentosLoading = true;
    this.documentoService.rechazarDocumento(event.documento.id, event.comentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: DocumentoData) => {
          this.documentosLoading = false;
          const index = this.documentosList.findIndex(doc => doc.id === event.documento.id);
          if (index !== -1) {
            this.documentosList[index] = { ...this.documentosList[index], ...response };
          }
        },
        error: (error: Error) => {
          this.documentosLoading = false;
          console.error('Error al rechazar documento:', error);
          alert('Error al rechazar el documento');
        }
      });
  }

  ngOnInit() {
    this.loadDepartments();

    if (this.initialData) {
      this.isAvalistaExpanded = true;
      this.editMode = true;
      this.loadInitialData(this.initialData);
    }

    if (this.documentos) {
      this.documentosList = this.documentos;
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

  private loadInitialData(data: AvalistaData) {
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
    const avalistaForm = this.clientForm.get('avalista') as FormGroup;
    avalistaForm.patchValue({
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      estadoCivil: data.estadoCivil,
      nombres: data.nombres,
      apellidos: data.apellidos,
      sexo: data.sexo,
      telefono: data.telefono,
      correo: data.correo || '',
      ingresos: data.ingresos,
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
      direccion: data.direccion
    });
  }

  private loadLocationData(data: AvalistaData) {
    if (data.departamento) {
      const dept = this.departamentos.find(d => d.nombre === data.departamento);
      if (dept) {
        this.selectedDepartamentoId = dept.id;
        this.loadProvinces(dept.id, () => {
          if (data.provincia) {
            const prov = this.avalistaProvincias.find(p => p.nombre === data.provincia);
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
      avalista: this.fb.group({
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]{8,12}$')]],
        estadoCivil: ['', Validators.required],
        nombres: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: ['', [Validators.required, Validators.minLength(2)]],
        sexo: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9,12}$')]],
        correo: ['', Validators.email],
        ingresos: ['', [Validators.required, Validators.min(0)]],
        departamento: ['', Validators.required],
        provincia: ['', Validators.required],
        distrito: ['', Validators.required],
        direccion: ['', [Validators.required, Validators.minLength(5)]]
      })
    });
  }

  get f() {
    return (this.clientForm.get('avalista') as FormGroup).controls;
  }

  get avalistaForm() {
    return this.clientForm.get('avalista') as FormGroup;
  }

  onAvalistaDepartamentoChange(): void {
    const deptName = this.avalistaForm.get('departamento')?.value;
    const dept = this.departamentos.find(d => d.nombre === deptName);

    if (dept) {
      this.selectedDepartamentoId = dept.id;
      this.loadProvinces(dept.id);
      this.avalistaForm.patchValue({
        provincia: '',
        distrito: ''
      });
      this.avalistaProvincias = [];
      this.avalistaDistritos = [];
    }
  }

  private loadProvinces(departamentoId: string, callback?: () => void) {
    this.locationService.getProvinces(departamentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provinces) => {
          this.avalistaProvincias = provinces;
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error loading provinces:', error);
        }
      });
  }

  onAvalistaProvinciaChange(): void {
    const provName = this.avalistaForm.get('provincia')?.value;
    const prov = this.avalistaProvincias.find(p => p.nombre === provName);

    if (prov) {
      this.selectedProvinciaId = prov.id;
      this.loadDistricts(prov.id);
      this.avalistaForm.patchValue({
        distrito: ''
      });
    }
  }

  private loadDistricts(provinciaId: string) {
    this.locationService.getDistricts(provinciaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (districts) => {
          this.avalistaDistritos = districts;
        },
        error: (error) => {
          console.error('Error loading districts:', error);
        }
      });
  }

  toggleAvalista(): void {
    this.isAvalistaExpanded = !this.isAvalistaExpanded;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.submitted = true;

    if (this.avalistaForm.invalid) {
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    this.isLoading = true;
    const formData = this.avalistaForm.value;
    const avalistaData: AvalistaData = {
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      estadoCivil: formData.estadoCivil,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      sexo: formData.sexo,
      telefono: formData.telefono,
      correo: formData.correo,
      ingresos: parseFloat(formData.ingresos),
      departamento: formData.departamento,
      provincia: formData.provincia,
      distrito: formData.distrito,
      direccion: formData.direccion
    };

    if (this.editMode) {
      this.prospectoApiService.updateAvalista(avalistaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.dataUpdated.emit(avalistaData);
            alert('Avalista actualizado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating avalista:', error);
            alert('Error al actualizar el avalista');
          }
        });
    } else {
      this.prospectoApiService.createAvalista(avalistaData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.editMode = true;
            this.isAvalistaExpanded = true;
            this.dataSaved.emit(avalistaData);
            alert('Avalista guardado exitosamente');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating avalista:', error);
            alert('Error al guardar el avalista');
          }
        });
    }
  }
}

