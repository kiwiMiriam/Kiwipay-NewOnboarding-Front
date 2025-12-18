import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { DocumentoService } from '../../../../core/services/documento.service';
import { ProspectosService, Prospecto } from '../../../../core/services/prospectos.service';
import { faCheck, faTimes, faComment } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  DocumentType, 
  Document,
  DocumentStatus 
} from '../../../../core/models/document.model';
import { ModalAccionComponent } from './modal-accion/modal-accion.component';
import { ProspectoTitular } from '../prospecto/prospecto-titular/prospecto-titular';
import { ProspectoPaciente } from '../prospecto/prospecto-paciente/prospecto-paciente';
import { ProspectoAval } from '../prospecto/prospecto-aval/prospecto-aval';
import { ProspectoApiService, ProspectoRiesgoData, ConyugeData } from '../../../../core/services/prospecto-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConyugeService } from '../../../../core/services/conyuge.service';

@Component({
  selector: 'app-adv-documentos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    ModalAccionComponent,
    ProspectoTitular,
    ProspectoPaciente,
    ProspectoAval
  ],
  templateUrl: './adv-documentos.component.html',
  styleUrls: ['./adv-documentos.component.scss']
})
export default class AdvDocumentosComponent implements OnInit, OnDestroy {

  faCheck = faCheck;
  faTimes = faTimes;

  // Variables
  documentos: Document[] = [];
  TIPOS_PERMITIDOS: DocumentType[] = [];
  mensajeError = '';
  
  // Client ID
  clientId: number | null = null;
  prospectoId: string | null = null;
  editMode = false;
  
  // Loading states
  isLoading = false;

  // Modal state
  mostrarModalAccion = false;
  documentoSeleccionado: Document | null = null;

  // Propiedades para componentes movidos
  prospectoData?: ProspectoRiesgoData;
  documentosRiesgo: any[] = [];
  documentosAsociado: any[] = [];
  
  // Propiedades para Cónyuge del Titular
  conyugeTitularForm?: FormGroup;
  isConyugeTitularExpanded = false;
  isUpdatingConyugeTitular = false;
  currentConyugeTitular?: ConyugeData;
  
  // Control de estado del cliente
  clientStatus: string = '';
  allowedActions: string[] = [];
  isExecutingAction = false;
  
  private destroy$ = new Subject<void>();
  accionSeleccionada: 'aprobar' | 'rechazar' = 'aprobar';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService,
    private documentoService: DocumentoService,
    private prospectosService: ProspectosService,
    private prospectoApiService: ProspectoApiService,
    private formBuilder: FormBuilder,
    private conyugeService: ConyugeService
  ) {
    this.initializeConyugeTitularForm();
  }

  ngOnInit(): void {
    // Cargar tipos de documentos
    this.loadDocumentTypes();
    
    // Obtener clientId de la ruta o del servicio de prospectos
    this.route.queryParams.subscribe(params => {
      this.prospectoId = params['id'];
      if (this.prospectoId) {
        this.editMode = true;
        this.clientId = Number(this.prospectoId);
        this.loadClientData();
        this.loadClientDocuments();
        // Cargar datos después de tener clientId
        setTimeout(() => {
          this.loadProspectoData();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos del cliente para obtener estado y acciones permitidas
   */
  private loadClientData(): void {
    if (!this.clientId) return;
    
    console.log('=== CARGANDO DATOS DEL CLIENTE ADV ===');
    console.log('Client ID:', this.clientId);
    
    this.prospectoApiService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client) => {
          console.log('Datos del cliente cargados (ADV):', client);
          this.clientStatus = client.status || '';
          this.allowedActions = client.allowedActions || [];
          
          console.log('Estado del cliente (ADV):', this.clientStatus);
          console.log('Acciones permitidas (ADV):', this.allowedActions);
        },
        error: (error) => {
          console.error('Error cargando datos del cliente (ADV):', error);
          this.clientStatus = '';
          this.allowedActions = [];
        }
      });
  }

  /**
   * Cargar datos del prospecto para los componentes movidos
   */
  private loadProspectoData(): void {
    if (!this.clientId) return;
    
    // Usar getClientById que hace GET /api/v1/clients/{id}
    this.prospectoApiService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientData: any) => {
          console.log('Client data loaded from API:', clientData);
          
          // Estructurar los datos correctamente para los componentes
          this.prospectoData = {
            titular: {
              id: clientData.id,
              documentType: clientData.documentType,
              documentNumber: clientData.documentNumber,
              firstNames: clientData.firstNames,
              lastNames: clientData.lastNames,
              maritalStatus: clientData.maritalStatus,
              gender: clientData.gender,
              birthDate: clientData.birthDate,
              email: clientData.email,
              phone: clientData.phone,
              suffersCondition: clientData.suffersCondition,
              address: clientData.address,
              // Campos adicionales para compatibilidad con frontend
              tipoDocumento: clientData.documentType,
              numeroDocumento: clientData.documentNumber,
              nombres: clientData.firstNames,
              apellidos: clientData.lastNames,
              estadoCivil: clientData.maritalStatus,
              sexo: clientData.gender,
              fechaNacimiento: clientData.birthDate,
              correo: clientData.email,
              telefono: clientData.phone,
              departamento: clientData.address?.departmentId,
              provincia: clientData.address?.provinceId,
              distrito: clientData.address?.districtId,
              direccion: clientData.address?.line1
            },
            paciente: undefined,
            avalista: undefined,
            documentos: []
          };
          
          console.log('ProspectoData structured for ADV:', this.prospectoData);
          console.log('Titular data for component:', this.prospectoData?.titular);
          
          // Cargar datos adicionales (paciente, aval)
          this.loadAdditionalData();
        },
        error: (error: any) => {
          console.error('Error loading client data:', error);
          // Si no existe, crear estructura vacía
          this.prospectoData = {
            titular: undefined,
            paciente: undefined,
            avalista: undefined,
            documentos: []
          };
        }
      });
  }
  
  /**
   * Cargar datos adicionales del paciente y aval
   */
  private loadAdditionalData(): void {
    if (!this.clientId) return;
    
    // Cargar paciente si existe
    this.prospectoApiService.getPatients(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          if (patients && patients.length > 0 && this.prospectoData) {
            this.prospectoData.paciente = patients[0]; // Tomar el primer paciente
            console.log('Patient data loaded:', this.prospectoData.paciente);
          }
        },
        error: (error) => {
          console.log('No patient found or error loading patient:', error);
        }
      });
    
    // Cargar aval si existe
    this.prospectoApiService.getGuarantor(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guarantor) => {
          if (guarantor && this.prospectoData) {
            this.prospectoData.avalista = guarantor;
            console.log('Guarantor data loaded:', this.prospectoData.avalista);
          }
        },
        error: (error) => {
          console.log('No guarantor found or error loading guarantor:', error);
        }
      });
  }

  /**
   * Obtener client ID para los componentes hijos
   */
  getClientId(): number | undefined {
    return this.clientId ? this.clientId : undefined;
  }

  // Métodos para manejar eventos de los componentes movidos
  onTitularSaved(data: any): void {
    console.log('Titular saved in ADV:', data);
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.titular = data;
  }

  onTitularUpdated(data: any): void {
    console.log('Titular updated in ADV:', data);
    if (this.prospectoData) {
      this.prospectoData.titular = data;
    }
  }

  onPacienteSaved(data: any): void {
    console.log('Paciente saved in ADV:', data);
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.paciente = data;
  }

  onPacienteUpdated(data: any): void {
    console.log('Paciente updated in ADV:', data);
    if (this.prospectoData) {
      this.prospectoData.paciente = data;
    }
  }

  onAvalistaSaved(data: any): void {
    console.log('Avalista saved in ADV:', data);
    if (!this.prospectoData) {
      this.prospectoData = {};
    }
    this.prospectoData.avalista = data;
  }

  onAvalistaUpdated(data: any): void {
    console.log('Avalista updated in ADV:', data);
    if (this.prospectoData) {
      this.prospectoData.avalista = data;
    }
  }

  /**
   * Cargar los tipos de documentos desde el backend
   */
  private loadDocumentTypes(): void {
    this.documentoService.getDocumentTypes().subscribe({
      next: (types) => {
        this.TIPOS_PERMITIDOS = types;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documentos:', error);
        this.mensajeError = 'No se pudieron cargar los tipos de documentos.';
      }
    });
  }

  /**
   * Refrescar datos del cliente después de una acción
   */
  private refreshClientData(): void {
    if (this.clientId) {
      this.loadClientData();
    }
  }

  /**
   * Verificar si una acción está permitida
   */
  isActionAllowed(action: string): boolean {
    return this.allowedActions.includes(action);
  }

  /**
   * Obtener texto del estado para mostrar en UI
   */
  getStatusDisplayText(): string {
    return this.prospectoApiService.mapStatusToDisplayText(this.clientStatus);
  }

  /**
   * Acción ADV: Aprobar por ADV
   */
  aprobarPorADV(): void {
    if (!this.clientId) {
      console.error('Client ID faltante');
      return;
    }

    if (confirm('¿Confirmar aprobación por ADV?')) {
      this.isExecutingAction = true;
      
      this.prospectoApiService.aprobarPorADV(this.clientId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Cliente aprobado por ADV exitosamente');
            alert('Cliente aprobado por ADV');
            // Refrescar datos del cliente
            this.refreshClientData();
            this.isExecutingAction = false;
          },
          error: (error) => {
            console.error('Error aprobando por ADV:', error);
            alert('Error al aprobar por ADV');
            this.isExecutingAction = false;
          }
        });
    }
  }

  /**
   * Acción ADV: Observar por ADV
   */
  observarPorADV(): void {
    if (!this.clientId) {
      console.error('Client ID faltante');
      return;
    }

    const reason = prompt('Ingrese el motivo de la observación:');
    if (reason && reason.trim()) {
      this.isExecutingAction = true;
      
      this.prospectoApiService.observarPorADV(this.clientId, reason.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Cliente observado por ADV exitosamente');
            alert('Cliente observado por ADV');
            // Refrescar datos del cliente
            this.refreshClientData();
            this.isExecutingAction = false;
          },
          error: (error) => {
            console.error('Error observando por ADV:', error);
            alert('Error al observar por ADV');
            this.isExecutingAction = false;
          }
        });
    }
  }

  /**
   * Cargar los documentos existentes del cliente
   */
  private loadClientDocuments(): void {
    if (!this.clientId) return;
    
    this.isLoading = true;
    this.documentoService.getClientDocuments(this.clientId).subscribe({
      next: (documents) => {
        this.documentos = documents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.isLoading = false;
      }
    });
  }

  obtenerNombreTipoDocumento(tipoId: string): string {
    const tipo = this.TIPOS_PERMITIDOS.find(t => t.id === tipoId);
    return tipo ? tipo.name : tipoId;
  }

  obtenerClaseIconoArchivo(mimeType: string): string {
    if (mimeType === 'application/pdf') {
      return 'icon-pdf';
    } else if (['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)) {
      return 'icon-image';
    }
    return '';
  }

  formatearTamanoArchivo(tamano: number): string {
    if (tamano < 1024) {
      return tamano + ' B';
    } else if (tamano < 1024 * 1024) {
      return (tamano / 1024).toFixed(2) + ' KB';
    } else {
      return (tamano / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  obtenerClaseIconoEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'APPROVED':
        return 'estado-icon aprobado';
      case 'REJECTED':
        return 'estado-icon rechazado';
      case 'READY':
      case 'PENDING':
      default:
        return 'estado-icon sin-estado';
    }
  }

  obtenerTextoEstado(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'READY':
        return 'Listo';
      case 'PENDING':
        return 'Pendiente';
      default:
        return 'Sin estado';
    }
  }

  /**
   * Abrir modal para aprobar documento
   */
  abrirModalAprobacion(documento: Document): void {
    this.documentoSeleccionado = documento;
    this.accionSeleccionada = 'aprobar';
    this.mostrarModalAccion = true;
  }

  /**
   * Abrir modal para rechazar documento
   */
  abrirModalRechazo(documento: Document): void {
    this.documentoSeleccionado = documento;
    this.accionSeleccionada = 'rechazar';
    this.mostrarModalAccion = true;
  }

  /**
   * Cerrar modal de acción
   */
  cerrarModalAccion(): void {
    this.mostrarModalAccion = false;
    this.documentoSeleccionado = null;
  }

  /**
   * Confirmar la acción desde el modal
   */
  confirmarAccion(comentario: string): void {
    if (!this.documentoSeleccionado?.id) return;

    const nuevoEstado = this.accionSeleccionada === 'aprobar' ? 'APPROVED' : 'REJECTED';

    // Pasar el comentario como tercer parámetro al servicio
    this.documentoService.reviewDocument(this.documentoSeleccionado.id, nuevoEstado, comentario.trim()).subscribe({
      next: () => {
        console.log(`Document ${nuevoEstado.toLowerCase()} successfully with comment:`, comentario);
        
        // Actualizar estado local inmediatamente
        const index = this.documentos.findIndex(doc => doc.id === this.documentoSeleccionado?.id);
        if (index !== -1) {
          this.documentos[index] = {
            ...this.documentos[index],
            reviewStatus: nuevoEstado,
            comment: comentario.trim(),
            reviewedAt: new Date().toISOString()
          };
        }
        
        // Recargar documentos desde el backend para asegurar sincronización
        this.loadClientDocuments();
        this.cerrarModalAccion();
      },
      error: (error) => {
        console.error('Error al actualizar estado del documento:', error);
        this.mensajeError = 'Error al actualizar el estado del documento.';
      }
    });
  }

  /**
   * Aprobar un documento rápidamente
   */
  aprobarDocumento(documento: Document): void {
    if (!documento.id) {
      console.error('Document ID is required for approval');
      return;
    }

    if (confirm('¿Estás seguro de que deseas aprobar este documento?')) {
      this.documentoService.reviewDocument(documento.id, 'APPROVED', '').subscribe({
        next: () => {
          console.log('Document approved successfully');
          
          // Actualizar estado local inmediatamente
          const index = this.documentos.findIndex(doc => doc.id === documento.id);
          if (index !== -1) {
            this.documentos[index] = {
              ...this.documentos[index],
              reviewStatus: 'APPROVED',
              reviewedAt: new Date().toISOString()
            };
          }
          // Recargar documentos desde el backend
          this.loadClientDocuments();
        },
        error: (error) => {
          console.error('Error approving document:', error);
          this.mensajeError = 'Error al aprobar el documento.';
        }
      });
    }
  }

  /**
   * Rechazar un documento rápidamente
   */
  rechazarDocumento(documento: Document): void {
    if (!documento.id) {
      console.error('Document ID is required for rejection');
      return;
    }

    if (confirm('¿Estás seguro de que deseas rechazar este documento?')) {
      this.documentoService.reviewDocument(documento.id, 'REJECTED', '').subscribe({
        next: () => {
          console.log('Document rejected successfully');
          
          // Actualizar estado local inmediatamente
          const index = this.documentos.findIndex(doc => doc.id === documento.id);
          if (index !== -1) {
            this.documentos[index] = {
              ...this.documentos[index],
              reviewStatus: 'REJECTED',
              reviewedAt: new Date().toISOString()
            };
          }
          // Recargar documentos desde el backend
          this.loadClientDocuments();
        },
        error: (error) => {
          console.error('Error rejecting document:', error);
          this.mensajeError = 'Error al rechazar el documento.';
        }
      });
    }
  }

  // ========== MÉTODOS PARA CÓNYUGE DEL TITULAR ==========

  /**
   * Inicializar formulario del cónyuge titular
   */
  private initializeConyugeTitularForm(): void {
    this.conyugeTitularForm = this.formBuilder.group({
      tipoDocumento: [''],
      numeroDocumento: [''],
      nombres: [''],
      apellidos: [''],
      correo: [''],
      telefono: ['']
    });
  }

  /**
   * Toggle sección del cónyuge titular
   */
  toggleConyugeTitularSection(): void {
    this.isConyugeTitularExpanded = !this.isConyugeTitularExpanded;
    if (this.isConyugeTitularExpanded && this.clientId) {
      this.loadConyugeTitularData();
    }
  }

  /**
   * Cargar datos del cónyuge titular
   */
  private loadConyugeTitularData(): void {
    if (!this.clientId) return;
    
    console.log('[ADV] Loading cónyuge titular data for clientId:', this.clientId);
    
    this.conyugeService.getConyugeByClientId(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conyuge) => {
          console.log('[ADV] Cónyuge titular data loaded:', conyuge);
          this.currentConyugeTitular = conyuge || undefined;
          
          if (conyuge && this.conyugeTitularForm) {
            const formData = {
              tipoDocumento: conyuge.tipoDocumento || conyuge.documentType || '',
              numeroDocumento: conyuge.numeroDocumento || conyuge.documentNumber || '',
              nombres: conyuge.nombres || conyuge.firstNames || '',
              apellidos: conyuge.apellidos || conyuge.lastNames || '',
              correo: conyuge.correo || conyuge.email || '',
              telefono: conyuge.telefono || conyuge.phone || ''
            };
            
            console.log('[ADV] Patching form with:', formData);
            this.conyugeTitularForm.patchValue(formData);
          } else {
            console.log('[ADV] No cónyuge data found, keeping form empty');
          }
        },
        error: (error) => {
          console.error('[ADV] Error loading cónyuge titular data:', error);
          this.currentConyugeTitular = undefined;
        }
      });
  }

  /**
   * Actualizar datos del cónyuge titular
   */
  updateConyugeTitular(): void {
    if (!this.clientId || !this.conyugeTitularForm || this.conyugeTitularForm.invalid) {
      console.warn('[ADV] Cannot update cónyuge - missing clientId, form, or form is invalid', {
        clientId: this.clientId,
        hasForm: !!this.conyugeTitularForm,
        isValid: this.conyugeTitularForm?.valid
      });
      return;
    }

    this.isUpdatingConyugeTitular = true;
    const formData = this.conyugeTitularForm.value;
    
    console.log('[ADV] Updating cónyuge titular...', {
      clientId: this.clientId,
      existingConyuge: this.currentConyugeTitular,
      formData
    });
    
    const conyugeData: ConyugeData = {
      id: this.currentConyugeTitular?.id,
      clientId: this.clientId,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      correo: formData.correo,
      telefono: formData.telefono,
      // Campos para backend compatibility
      documentType: formData.tipoDocumento,
      documentNumber: formData.numeroDocumento,
      firstNames: formData.nombres,
      lastNames: formData.apellidos,
      email: formData.correo,
      phone: formData.telefono
    };

    // Determinar si es crear o actualizar
    const isUpdate = this.currentConyugeTitular && this.currentConyugeTitular.id;
    console.log(`[ADV] ${isUpdate ? 'Updating' : 'Creating'} cónyuge titular`, conyugeData);

    const operation = isUpdate ? 
      this.conyugeService.actualizarConyuge(this.clientId, conyugeData) :
      this.conyugeService.crearConyuge(this.clientId, conyugeData);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          console.log('[ADV] Cónyuge titular updated successfully:', resultado);
          this.currentConyugeTitular = resultado;
          this.isUpdatingConyugeTitular = false;
          
          // Mostrar mensaje de éxito
          const mensaje = isUpdate ? 
            'Datos del cónyuge del titular actualizados correctamente' : 
            'Cónyuge del titular creado correctamente';
          alert(mensaje);
        },
        error: (error) => {
          console.error('[ADV] Error updating cónyuge titular:', error);
          this.isUpdatingConyugeTitular = false;
          alert('Error al actualizar los datos del cónyuge del titular. Revise la consola para más detalles.');
        }
      });
  }

  /**
   * Reset formulario del cónyuge titular
   */
  resetConyugeTitularForm(): void {
    if (this.conyugeTitularForm) {
      if (this.currentConyugeTitular) {
        // Si existe cónyuge, restaurar datos originales
        this.conyugeTitularForm.patchValue({
          tipoDocumento: this.currentConyugeTitular.tipoDocumento || this.currentConyugeTitular.documentType || '',
          numeroDocumento: this.currentConyugeTitular.numeroDocumento || this.currentConyugeTitular.documentNumber || '',
          nombres: this.currentConyugeTitular.nombres || this.currentConyugeTitular.firstNames || '',
          apellidos: this.currentConyugeTitular.apellidos || this.currentConyugeTitular.lastNames || '',
          correo: this.currentConyugeTitular.correo || this.currentConyugeTitular.email || '',
          telefono: this.currentConyugeTitular.telefono || this.currentConyugeTitular.phone || ''
        });
      } else {
        // Si no existe cónyuge, limpiar formulario
        this.conyugeTitularForm.reset();
      }
    }
  }

  navigateBack(): void {
    this.navigationService.navigateToTab('documentos');
  }

  navigateNext(): void {
    this.navigationService.navigateToTab('prospecto');
  }
}