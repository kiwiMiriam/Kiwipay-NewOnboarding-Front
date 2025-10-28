import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
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
    { value: '3', label: 'Trujillo' }
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
    private navigationService: NavigationService,
    private cotizadorService: CotizadorService,
    private cuotasCalculator: CuotasCalculatorService,
  ) {}

  ngOnInit(): void {
    // ✅ inicialización segura
    this.cotizadorForm = this.initCotizadorForm();
    this.montoForm = this.initMontoForm();
    this.setupMontoFormSubscription();
    this.setupCampaniaSubscription();
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
      monto: ['', [Validators.required, Validators.min(1000)]],
      campana: [false]
    });
  }

  private setupCampaniaSubscription(): void {
    // Actualizar opciones cuando cambie el estado de la campaña
    this.usarCampaniaControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(usarCampania => {
        this.actualizarListaOpciones();
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
    if (response.success) {
      this.cotizacion = response;
      this.procesarRespuesta(response);
    } else {
      console.error('Error en la respuesta:', response.message);
    }
  }

  private handleCotizacionError(error: unknown): void {
    this.loading = false;
    console.error('Error en la petición:', error);
  }

  private procesarRespuesta(response: CotizacionResponse): void {
    const { data } = response;

    // Actualizar montos y tasas regulares
    this.montoPreAprobado = data.payment.dcmMaf;
    this.montoSeleccionado = data.payment.dcmMaf;
    this.tea = data.dcmTEA;
    this.tcea = data.dcmTCEA;

    // Actualizar información de campaña
    this.hayCampaniaActiva = data.isCampaing;
    if (data.isCampaing && data.campaing) {
      this.campaniaNombre = data.campaing.strCampaing || 'Campaña Especial';
      this.montoMaximoCampania = data.campaing.dcmMaf;
      // Solo activar la campaña si el monto seleccionado es válido para ella
      this.usarCampaniaControl.setValue(
        this.montoSeleccionado <= this.montoMaximoCampania
      );
    } else {
      this.usarCampaniaControl.setValue(false);
    }

    this.actualizarFormularioMonto();
    this.calcularOpciones();
  }

  private actualizarFormularioMonto(): void {
    this.montoForm.setControl('monto', this.fb.control(
      this.montoPreAprobado,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(this.montoPreAprobado),
        this.validarMontoMaximo.bind(this)
      ]
    ));
  }

  private handleMontoChange(valor: string | null): void {
    if (!valor) return;

    // Convertir el valor formateado a número y validar
    const montoNumerico = this.parsearMonto(valor);
    if (isNaN(montoNumerico)) return;

    // Siempre establecer el monto seleccionado primero
    this.montoSeleccionado = montoNumerico;

    // Validar contra el monto pre-aprobado
    if (montoNumerico > this.montoPreAprobado) {
      const montoFormateado = this.formatearMontoParaInput(this.montoPreAprobado);
      this.montoForm.get('monto')?.setValue(montoFormateado, { emitEvent: false });
      this.montoSeleccionado = this.montoPreAprobado;

      // Deshabilitar cuotas cuando excede
      this.opciones = [];
      this.opcionSeleccionada = null;
      return;
    }

    // Calcular inmediatamente las nuevas cuotas
    this.calcularOpciones();
    this.actualizarListaOpciones();
  }

  // Formatear el monto mientras se escribe
  formatearMonto(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/[^0-9]/g, '');

    // Convertir a número y formatear
    const numero = parseInt(valor);
    if (!isNaN(numero)) {
      input.value = this.formatearMontoParaInput(numero);
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

  seleccionarCuota(opcion: CuotaOption): void {
    this.opciones.forEach(opt => opt.selected = false);
    opcion.selected = true;
    this.opcionSeleccionada = opcion;
  }
   ngOnDestroy(): void {
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
    this.navigationService.navigateToTab('datos-clinica');
  }

  navigateNext(): void {
    this.navigationService.navigateToTab('documento');
  }
}
