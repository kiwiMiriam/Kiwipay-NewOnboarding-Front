import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { QuoteService } from '../../../../core/services/quote.service';
import { Subject, takeUntil } from 'rxjs';
import { CotizadorService } from './services/cotizador.service';
import { CuotasCalculatorService } from './services/cuotas-calculator.service';
import { CotizacionResponse, CuotaOption, FormularioCotizador } from './models/cotizador.models';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cotizador.component.html',
  styleUrls: ['./cotizador.component.scss']
})
export class CotizadorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Client tracking
  clientId: number | null = null;
  quoteId: number | null = null;
  editMode = false;

  // Formularios
  cotizadorForm!: FormGroup;
  montoForm!: FormGroup;

  // Estados del componente
  submitted = false;
  loading = false;

  // Campaña
  hayCampaniaActiva = false;
  campaniaNombre: string = '';
  montoMaximoCampania: number = 0;
  usarCampaniaControl = new FormControl(false);

  // Datos para selects
  readonly tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de extranjería' },
    { value: 'PAS', label: 'Pasaporte' }
  ];

  readonly sedes = [
    { value: '1', label: 'Lima' },
    { value: '2', label: 'Arequipa' },
    { value: '3', label: 'Trujillo' },
    { value: '7', label: 'Cusco' },
  ];

  // Datos de cotización
  cotizacion: CotizacionResponse | null = null;
  montoPreAprobado = 0;
  montoSeleccionado = 0;
  tea = 0;
  tcea = 0;

  // Opciones de cuotas
  opcionesRegulares: CuotaOption[] = [];
  opcionesCampania: CuotaOption[] = [];
  opciones: CuotaOption[] = [];
  opcionSeleccionada: CuotaOption | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private navigationService: NavigationService,
    private cotizadorService: CotizadorService,
    private cuotasCalculator: CuotasCalculatorService,
    private quoteService: QuoteService
  ) {}

  ngOnInit(): void {
    // ✅ inicialización segura
    this.cotizadorForm = this.initCotizadorForm();
    this.montoForm = this.initMontoForm();
    this.setupMontoFormSubscription();
    this.setupCampaniaSubscription();

    // Obtener clientId de query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const clientIdParam = params['clientId'];
      if (clientIdParam) {
        this.clientId = Number(clientIdParam);
        this.loadExistingQuote();
      }
    });
  }

  private initCotizadorForm(): FormGroup {
    return this.fb.group({
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      ingresos: ['', [Validators.required, Validators.min(0)]],
      sede: ['1', Validators.required]
    });
  }

  private initMontoForm(): FormGroup {
    return this.fb.group({
      monto: ['', [Validators.required, Validators.min(1)]],
      campana: [false]
    });
  }

  private setupCampaniaSubscription(): void {
    // Actualizar opciones cuando cambie el estado de la campaña
    this.usarCampaniaControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(usarCampania => {
        this.actualizarMaximoYValidadores();
        this.actualizarListaOpciones();
      });
  }

  private loadExistingQuote(): void {
    if (!this.clientId) return;

    this.quoteService.getQuotesByClientId(this.clientId).subscribe({
      next: (quotes) => {
        if (quotes && quotes.length > 0) {
          // Cargar la primera cotización (o la más reciente)
          const quote = quotes[0];
          this.quoteId = quote.id || null;
          this.editMode = true;

          // Llenar el formulario con los datos existentes
          this.cotizadorForm.patchValue({
            tipoDocumento: quote.documentType,
            numeroDocumento: quote.documentNumber,
            ingresos: quote.monthlyIncome,
            sede: quote.branchId
          });
        }
      },
      error: (error) => {
        // 404 es esperado cuando no hay cotizaciones previas
        if (error.status === 404) {
          this.editMode = false;
        } else {
          console.error('Error loading quotes:', error);
        }
      }
    });
  }

  private setupMontoFormSubscription(): void {
    this.montoForm.get('monto')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.handleMontoChange.bind(this));
  }

  get f() { return this.cotizadorForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.cotizadorForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.cotizadorForm.value;

    const payload = {
      TypeDocument: formData.tipoDocumento,
      NumDocument: formData.numeroDocumento,
      Income: formData.ingresos.toString(),
      IdHeadquarters: formData.sede
    };

    this.cotizadorService.getCotizacion(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: this.handleCotizacionSuccess.bind(this),
        error: this.handleCotizacionError.bind(this)
      });
  }

  private handleCotizacionSuccess(response: CotizacionResponse): void {
    this.loading = false;
    this.cotizacion = response;
    if (response.success) {
      this.procesarRespuesta(response);
    } else {
      // Limpiar estado de opciones y montos para vista de rechazo
      this.opciones = [];
      this.opcionSeleccionada = null;
      this.montoPreAprobado = 0;
      this.montoSeleccionado = 0;
    }
  }

  private handleCotizacionError(error: unknown): void {
    this.loading = false;
    console.error('Error en la petición:', error);
  }

  private procesarRespuesta(response: CotizacionResponse): void {
    const { data } = response;

    // Actualizar montos y tasas regulares (siempre redondeo hacia abajo)
    this.montoPreAprobado = Math.floor(data.payment.dcmMaf);
    // Redondear el monto seleccionado para la primera carga hacia abajo
    this.montoSeleccionado = Math.floor(data.payment.dcmMaf);
    this.tea = data.dcmTEA;
    this.tcea = data.dcmTCEA;

    // Actualizar información de campaña
    this.hayCampaniaActiva = data.isCampaing;
    if (data.isCampaing && data.campaing) {
      this.campaniaNombre = data.campaing.strCampaing || 'Campaña Especial';
      this.montoMaximoCampania = Math.floor(data.campaing.dcmMaf);
      // Solo activar la campaña si el monto seleccionado es válido para ella
      this.usarCampaniaControl.setValue(
        this.montoSeleccionado <= this.montoMaximoCampania
      );
    } else {
      this.usarCampaniaControl.setValue(false);
    }

    this.actualizarFormularioMonto();
    this.calcularOpciones();
    this.actualizarMaximoYValidadores();
  }

  private actualizarFormularioMonto(): void {
    // Usar el monto seleccionado redondeado y formatearlo para el input
    const montoFormateado = this.formatearMontoParaInput(this.montoSeleccionado);

    this.montoForm.setControl('monto', this.fb.control(
      montoFormateado,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(this.montoPreAprobado),
        this.validarMontoMaximo.bind(this)
      ]
    ));
  }

  private handleMontoChange(valor: string | null): void {
    if (!valor) {
      this.montoSeleccionado = 0;
      this.opciones = [];
      this.opcionSeleccionada = null;
      return;
    }

    // Convertir el valor formateado a número
    const montoNumerico = this.parsearMonto(valor);
    if (isNaN(montoNumerico)) {
      this.montoSeleccionado = 0;
      this.opciones = [];
      this.opcionSeleccionada = null;
      return;
    }

    // Establecer el monto seleccionado
    this.montoSeleccionado = montoNumerico;

    // Calcular cuotas en tiempo real si el monto es válido
    if (montoNumerico > 0 && montoNumerico <= this.montoPreAprobado) {
      this.calcularOpciones();
      this.actualizarListaOpciones();
    } else {
      // Deshabilitar cuotas cuando excede o es inválido
      this.opciones = [];
      this.opcionSeleccionada = null;
    }
  }

  // Formatear el monto mientras se escribe y calcular cuotas en tiempo real
  formatearMonto(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/[^0-9]/g, '');

    // Limpiar el debounce timer anterior si existe
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Convertir a número y formatear
    const numero = parseInt(valor);
    if (!isNaN(numero)) {
      const valorFormateado = this.formatearMontoParaInput(numero);

      // Actualizar el input directamente
      input.value = valorFormateado;

      // Usar debounce para calcular cuotas después de que el usuario deje de escribir
      this.debounceTimer = setTimeout(() => {
        // Actualizar el monto seleccionado
        this.montoSeleccionado = numero;

        // Calcular cuotas en tiempo real si el monto es válido
        if (numero > 0 && numero <= this.montoPreAprobado) {
          this.calcularOpciones();
          this.actualizarListaOpciones();
        } else {
          // Deshabilitar cuotas cuando excede o es inválido
          this.opciones = [];
          this.opcionSeleccionada = null;
        }
      }, 100); // 100ms de debounce para mejor rendimiento
    } else {
      // Si no es un número válido, limpiar el input y deshabilitar cuotas
      input.value = '';
      this.montoSeleccionado = 0;
      this.opciones = [];
      this.opcionSeleccionada = null;
    }
  }

  private formatearMontoParaInput(monto: number): string {
    return monto.toLocaleString('es-PE', {
      maximumFractionDigits: 0,
      useGrouping: true
    });
  }

  private parsearMonto(montoFormateado: string): number {
    return parseInt(montoFormateado.replace(/[^0-9]/g, ''));
  }

  private calcularOpciones(): void {
    if (!this.cotizacion || !this.montoSeleccionado) return;

    try {
      const resultado = this.cuotasCalculator.procesarOpcionesCuotas(
        this.cotizacion,
        this.montoSeleccionado
      );

      // Convertir los resultados a opciones de UI
      this.opcionesRegulares = this.cuotasCalculator.convertirACuotasUI(resultado.cuotasRegulares);
      this.opcionesCampania = this.cuotasCalculator.convertirACuotasUI(resultado.cuotasCampania);

      // Actualizar lista de opciones según modo seleccionado
      this.actualizarListaOpciones();

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error al calcular cuotas:', error.message);
        // Aquí podrías mostrar un mensaje al usuario
      }
      this.opciones = [];
      this.opcionSeleccionada = null;
    }
  }

  private actualizarListaOpciones(): void {
    // Determinar qué opciones mostrar basado en el estado de la campaña
    const opcionesAMostrar = this.usarCampaniaControl.value && this.hayCampaniaActiva
      ? this.opcionesCampania
      : this.opcionesRegulares;

    // Ordenar las opciones
    this.opciones = this.cuotasCalculator.ordenarOpciones(opcionesAMostrar);

    // Seleccionar la primera opción por defecto
    if (this.opciones.length > 0) {
      this.seleccionarCuota(this.opciones[0]);
    }
  }

  private actualizarMaximoYValidadores(): void {
    if (!this.cotizacion) return;
    const usandoCampania = !!this.usarCampaniaControl.value && this.hayCampaniaActiva && this.cotizacion.data.campaing;
    const nuevoMaximo = usandoCampania ? Math.floor(this.cotizacion.data.campaing.dcmMaf) : Math.floor(this.cotizacion.data.payment.dcmMaf);
    this.montoPreAprobado = nuevoMaximo;

    const controlMonto = this.montoForm.get('monto');
    if (controlMonto) {
      controlMonto.clearValidators();
      controlMonto.addValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.montoPreAprobado),
        this.validarMontoMaximo.bind(this)
      ]);
      controlMonto.updateValueAndValidity({ emitEvent: false });
    }

    // Ajustar el monto seleccionado si excede el nuevo máximo
    if (this.montoSeleccionado > this.montoPreAprobado) {
      this.montoSeleccionado = this.montoPreAprobado;
      const montoFormateado = this.formatearMontoParaInput(this.montoSeleccionado);
      this.montoForm.get('monto')?.setValue(montoFormateado, { emitEvent: false });
    }
  }

  togglearCampania(): void {
    if (!this.hayCampaniaActiva || !this.cotizacion) return;
    const nuevoValor = !this.usarCampaniaControl.value;

    // Determinar el nuevo máximo según el modo
    const nuevoMaximo = nuevoValor
      ? Math.floor(this.cotizacion.data.campaing?.dcmMaf || this.montoMaximoCampania)
      : Math.floor(this.cotizacion.data.payment.dcmMaf);

    // Aplicar el estado del toggle sin emitir evento (controlamos manualmente el flujo)
    this.usarCampaniaControl.setValue(nuevoValor, { emitEvent: false });

    // Actualizar máximos, validadores y monto seleccionado al máximo del modo activo
    this.montoPreAprobado = nuevoMaximo;
    this.montoSeleccionado = nuevoMaximo;
    const montoFormateado = this.formatearMontoParaInput(this.montoSeleccionado);
    this.montoForm.get('monto')?.setValue(montoFormateado, { emitEvent: false });
    this.actualizarMaximoYValidadores();

    // Recalcular opciones con el nuevo monto y refrescar la lista inmediatamente
    this.calcularOpciones();
    this.actualizarListaOpciones();
  }

  seleccionarCuota(opcion: CuotaOption): void {
    this.opciones.forEach(opt => opt.selected = false);
    opcion.selected = true;
    this.opcionSeleccionada = opcion;
  }

  guardarQuote(): void {
    if (!this.clientId) {
      alert('No se encontró el ID del cliente');
      return;
    }

    if (!this.cotizadorForm.valid) {
      alert('Por favor complete todos los campos del formulario');
      return;
    }

    const formData = this.cotizadorForm.value;
    const quoteData = {
      documentType: formData.tipoDocumento,
      documentNumber: formData.numeroDocumento,
      monthlyIncome: formData.ingresos,
      branchId: formData.sede
    };

    if (this.editMode && this.quoteId) {
      // Actualizar quote existente
      this.quoteService.actualizarQuote(this.quoteId, quoteData).subscribe({
        next: () => {
          alert('Cotización actualizada exitosamente');
        },
        error: (error) => {
          console.error('Error updating quote:', error);
          alert('Error al actualizar cotización: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Crear nueva quote
      this.quoteService.crearQuote(this.clientId, quoteData).subscribe({
        next: (response) => {
          this.quoteId = response.id || null;
          this.editMode = true;
          alert('Cotización guardada exitosamente');
        },
        error: (error) => {
          console.error('Error creating quote:', error);
          alert('Error al guardar cotización: ' + (error.error?.message || error.message));
        }
      });
    }
  }

   ngOnDestroy(): void {
    // Limpiar el debounce timer si existe
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  limpiarFormulario(): void {
    this.submitted = false;
    this.cotizacion = null;
    this.opciones = [];
    this.opcionSeleccionada = null;
    this.montoPreAprobado = 0;
    this.montoSeleccionado = 0;
    this.tea = 0;
    this.tcea = 0;

    this.cotizadorForm.reset({
      tipoDocumento: 'DNI',
      sede: '1'
    });
    this.montoForm.reset();
  }

  /**
   * Validador personalizado para asegurar que el monto no exceda el máximo pre-aprobado
   */
  private validarMontoMaximo(control: AbstractControl): ValidationErrors | null {
    const valor = this.parsearMonto(control.value);
    if (isNaN(valor)) return null;

    if (valor > this.montoPreAprobado) {
      return {
        montoExcedido: {
          max: this.formatearMontoParaInput(this.montoPreAprobado),
          actual: this.formatearMontoParaInput(valor)
        }
      };
    }
    return null;
  }

  /**
   * Verifica si las cuotas deben estar deshabilitadas
   */
  get cuotasDeshabilitadas(): boolean {
    return this.montoSeleccionado <= 0 || this.montoSeleccionado > this.montoPreAprobado;
  }

  /**
   * Devuelve el resumen de la cotización seleccionada
   */
  get resumenCotizacion(): {
    montoTotal: number;
    cuotaMensual: number;
    numeroCuotas: number;
    tea: number;
    tcea: number;
    tipoCuota: string;
  } | null {
    if (!this.opcionSeleccionada) return null;

    return {
      montoTotal: this.opcionSeleccionada.montoTotal,
      cuotaMensual: this.opcionSeleccionada.monto,
      numeroCuotas: this.opcionSeleccionada.value,
      tea: this.opcionSeleccionada.tea,
      tcea: this.opcionSeleccionada.tcea,
      tipoCuota: this.opcionSeleccionada.esCampania ? 'Campaña' : 'Regular'
    };
  }

  navigateBack(): void {
    if (this.clientId) {
      this.router.navigate(['/dashboard/nuevo-prospecto/datos-clinica'], {
        queryParams: { clientId: this.clientId }
      });
    } else {
      this.router.navigate(['/dashboard/nuevo-prospecto/datos-clinica']);
    }
  }

  navigateNext(): void {
    if (!this.clientId) {
      alert('No se encontró el ID del cliente');
      return;
    }

    this.router.navigate(['/dashboard/nuevo-prospecto/documentos'], {
      queryParams: { clientId: this.clientId }
    });
  }
}
