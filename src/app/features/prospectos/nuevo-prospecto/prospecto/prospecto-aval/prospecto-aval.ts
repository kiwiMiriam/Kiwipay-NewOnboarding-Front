import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
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
export class ProspectoAval implements OnInit, OnDestroy {
  @Input() initialData?: AvalistaData;
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
    if (this.initialData) {
      this.isAvalistaExpanded = true;
      this.editMode = true;
      this.loadInitialData(this.initialData);
    }
    if (this.documentos && this.documentos.length) {
      this.documentosList = [...this.documentos];
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //

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

  // ...existing code...
  private patchAvalistaForm(data: AvalistaData): void {
    const avalistaFormObject = this.clientForm.get('avalista');
    if (avalistaFormObject) {
      avalistaFormObject.patchValue({
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
  }

  private loadLocationData(data: AvalistaData): void {
    if (data.departamento) {
      const dept = this.departamentos.find((d) => d.nombre === data.departamento);
      if (dept) {
        this.selectedDepartamentoId = dept.id;
        this.loadProvinces(dept.id, () => {
          if (data.provincia) {
            const prov = this.avalistaProvincias.find((p) => p.nombre === data.provincia);
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
    const deptName = this.avalistaForm.get('departamento')?.value;
    const dept = this.departamentos.find((d) => d.nombre === deptName);

    if (dept) {
      this.selectedDepartamentoId = dept.id;
      this.loadProvinces(dept.id);
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
    const provName = this.avalistaForm.get('provincia')?.value;
    const prov = this.avalistaProvincias.find((p) => p.nombre === provName);

    if (prov) {
      this.selectedProvinciaId = prov.id;
      this.loadDistricts(prov.id);
      this.avalistaForm.patchValue({
        distrito: '',
      });
    }
  }

  private loadDistricts(provinciaId: string): void {
    this.locationService
      .getDistricts(provinciaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (districts) => {
          this.avalistaDistritos = districts;
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
      direccion: formData.direccion,
    };

    const saveAvalista$ = this.editMode
      ? this.prospectoApiService.updateAvalista(avalistaData)
      : this.prospectoApiService.createAvalista(avalistaData);

    saveAvalista$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.editMode) {
          this.dataUpdated.emit(avalistaData);
          alert('Avalista actualizado exitosamente');
        } else {
          this.editMode = true;
          this.isAvalistaExpanded = true;
          this.dataSaved.emit(avalistaData);
          alert('Avalista guardado exitosamente');
        }
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
        console.error('Error en operación de avalista:', error);
        alert(`Error al ${this.editMode ? 'actualizar' : 'guardar'} el avalista`);
      },
    });
  }
}
