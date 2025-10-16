import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { NavigationService } from '../../../../core/services/navigation.service';

interface CotizacionPayload {
  TypeDocument: string;
  NumDocument: string;
  Income: string;
  IdHeadquarters: string;
}

interface CotizacionResponse {
  success: boolean;
  data: {
    strStatus: string;
    dcmTEA: number;
    dcmTCEA: number;
    payment: {
      dcmMaf: number;
      listQuotas: {
        [key: string]: number;
      };
    };
    isCampaing: boolean;
    campaing: {
      intIdCampaing: number;
      strCampaing: string | null;
      dcmTEA: number;
      dcmTCEA: number;
      dcmMaf: number;
      listQuotas: any;
    };
  };
  message: string;
}

interface CuotaOption {
  id: string;
  label: string;
  value: number;
  monto: number;
  selected?: boolean;
}

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './cotizador.component.html',
  styleUrls: ['./cotizador.component.scss']
})
export class CotizadorComponent implements OnInit {
  cotizadorForm: FormGroup;
  submitted = false;
  loading = false;

  // Datos para formulario y selects
  tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carné de extranjería' },
    { value: 'PAS', label: 'Pasaporte' }
  ];

  sedes = [
    { value: '1', label: 'Lima' },
    { value: '2', label: 'Arequipa' },
    { value: '3', label: 'Trujillo' }
  ];

  // Datos de respuesta
  cotizacion: CotizacionResponse | null = null;
  montoPreAprobado: number = 0;
  montoSeleccionado: number = 0;
  tea: number = 0;
  tcea: number = 0;
  opciones: CuotaOption[] = [];
  opcionSeleccionada: CuotaOption | null = null;

  // FormGroup para el monto a solicitar
  montoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private navigationService: NavigationService
  ) {
    this.cotizadorForm = this.fb.group({
      tipoDocumento: ['DNI', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
      ingresos: ['', [Validators.required, Validators.min(0)]],
      sede: ['1', Validators.required]
    });

    // Inicializar el formulario para el monto
    this.montoForm = this.fb.group({
      monto: [0, [Validators.required, Validators.min(1)]]
    });
  }  ngOnInit(): void {
    // Inicializar el componente
  }

  get f() { return this.cotizadorForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.cotizadorForm.invalid) {
      return;
    }

    this.loading = true;

    const payload: CotizacionPayload = {
      TypeDocument: this.f['tipoDocumento'].value,
      NumDocument: this.f['numeroDocumento'].value,
      Income: this.f['ingresos'].value.toString(),
      IdHeadquarters: this.f['sede'].value
    };

    this.obtenerCotizacion(payload);
  }

  obtenerCotizacion(payload: CotizacionPayload): void {
    if (environment.useMockApi) {
      // Usar respuesta simulada para desarrollo
      setTimeout(() => {
        const mockResponse: CotizacionResponse = {
          success: true,
          data: {
            strStatus: "Aprobado",
            dcmTEA: 59.60,
            dcmTCEA: 60.67,
            payment: {
              dcmMaf: 12189.20,
              listQuotas: {
                "18Quotas": 14989.97,
                "16Quotas": 14056.69,
                "14Quotas": 12999.44,
                "12Quotas": 11799.54,
                "6Quotas": 7100.35
              }
            },
            isCampaing: false,
            campaing: {
              intIdCampaing: 0,
              strCampaing: null,
              dcmTEA: 0,
              dcmTCEA: 0,
              dcmMaf: 0,
              listQuotas: null
            }
          },
          message: ""
        };

        this.loading = false;
        this.cotizacion = mockResponse;
        this.procesarRespuesta(mockResponse);
      }, 1000); // Simular 1 segundo de delay
    } else {
      // Llamar al API real
      const url = `${environment.apiUrl}/apiprospectos/simulator/postGeneratePreAprobate`;

      this.http.post<CotizacionResponse>(url, payload)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              this.cotizacion = response;
              this.procesarRespuesta(response);
            } else {
              // Manejar error de negocio
              console.error('Error en la respuesta:', response.message);
            }
          },
          error: (error) => {
            this.loading = false;
            console.error('Error en la petición:', error);
          }
        });
    }
  }

  procesarRespuesta(response: CotizacionResponse): void {
    const { data } = response;

    this.montoPreAprobado = data.payment.dcmMaf;
    this.montoSeleccionado = data.payment.dcmMaf;
    this.tea = data.dcmTEA;
    this.tcea = data.dcmTCEA;

    // Actualizar formulario de monto con validador personalizado
    this.montoForm.setControl('monto', this.fb.control(
      this.montoPreAprobado,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(this.montoPreAprobado),
        this.validarMontoMaximo.bind(this)
      ]
    ));

    // Escuchar cambios en el monto seleccionado
    this.montoForm.get('monto')?.valueChanges.subscribe(valor => {
      if (valor && !isNaN(valor)) {
        this.montoSeleccionado = Number(valor);
        // Asegurar que el valor no exceda el máximo permitido
        if (this.montoSeleccionado > this.montoPreAprobado) {
          this.montoForm.get('monto')?.setValue(this.montoPreAprobado, { emitEvent: false });
          this.montoSeleccionado = this.montoPreAprobado;
        }
        this.recalcularCuotas();
      }
    });

    // Procesar opciones de cuotas
    this.opciones = [];
    const listQuotas = data.payment.listQuotas;

    Object.keys(listQuotas).forEach(key => {
      const numCuotas = parseInt(key.replace('Quotas', ''));
      const totalPagar = listQuotas[key];
      const montoCuota = totalPagar / numCuotas;

      this.opciones.push({
        id: key,
        label: `${numCuotas} cuotas mensuales de S/ ${montoCuota.toFixed(1)}`,
        value: numCuotas,
        monto: montoCuota
      });
    });

    // Ordenar de mayor a menor número de cuotas
    this.opciones.sort((a, b) => b.value - a.value);

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

  limpiarFormulario(): void {
    this.submitted = false;
    this.cotizacion = null;
    this.opciones = [];
    this.opcionSeleccionada = null;
    this.cotizadorForm.reset({
      tipoDocumento: 'DNI',
      sede: '1'
    });
    this.montoForm.reset();
  }

  /**
   * Validador personalizado para asegurar que el monto no exceda el máximo pre-aprobado
   */
  validarMontoMaximo(control: AbstractControl): ValidationErrors | null {
    const valor = Number(control.value);
    if (isNaN(valor) || valor > this.montoPreAprobado) {
      return { 'montoExcedido': true };
    }
    return null;
  }

  /**
   * Recalcula las cuotas basado en el monto seleccionado
   */
  recalcularCuotas(): void {
    if (!this.cotizacion || !this.montoSeleccionado) return;

    // Factor de proporcionalidad entre el monto seleccionado y el pre-aprobado
    const factor = this.montoSeleccionado / this.montoPreAprobado;

    // Recalcular las opciones de cuotas
    this.opciones.forEach(opcion => {
      const nuevaMonto = opcion.monto * factor;
      opcion.label = `${opcion.value} cuotas mensuales de S/ ${nuevaMonto.toFixed(1)}`;
      opcion.monto = nuevaMonto;
    });

    // Reseleccionar la opción actual si existe
    if (this.opcionSeleccionada) {
      const opcionId = this.opcionSeleccionada.id;
      const opcionActualizada = this.opciones.find(o => o.id === opcionId);
      if (opcionActualizada) {
        this.seleccionarCuota(opcionActualizada);
      } else if (this.opciones.length > 0) {
        this.seleccionarCuota(this.opciones[0]);
      }
    }
  }

  /**
   * Navega hacia atrás (datos-clinicas) y actualiza el estado de la pestaña activa
   */
  navigateBack(): void {
    // Usa el servicio de navegación para navegar hacia atrás desde la pestaña actual
    this.navigationService.navigateToTab('clinica');
  }

  /**
   * Navega hacia adelante (documentos) y actualiza el estado de la pestaña activa
   */
  navigateNext(): void {
    // Usa el servicio de navegación para navegar hacia adelante desde la pestaña actual
    this.navigationService.navigateToTab('documento');
  }
}
