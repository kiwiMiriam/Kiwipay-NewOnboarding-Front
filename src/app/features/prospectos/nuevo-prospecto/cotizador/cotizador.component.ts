import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="section-container">
      <h3>Cotizador</h3>

      <form [formGroup]="cotizadorForm" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <div class="form-group">
            <label for="servicio">Tipo de Servicio</label>
            <select id="servicio" formControlName="servicio">
              <option value="">Seleccionar servicio</option>
              <option value="basico">Servicio Básico</option>
              <option value="estandar">Servicio Estándar</option>
              <option value="premium">Servicio Premium</option>
            </select>
            @if (submitted && f['servicio'].errors) {
              <div class="error-message">Debe seleccionar un tipo de servicio</div>
            }
          </div>

          <div class="form-group">
            <label for="cantidad">Cantidad</label>
            <input type="number" id="cantidad" formControlName="cantidad" min="1">
            @if (submitted && f['cantidad'].errors) {
              <div class="error-message">La cantidad es requerida y debe ser mayor a 0</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="precio">Precio Unitario</label>
            <input type="number" id="precio" formControlName="precio" readonly>
          </div>

          <div class="form-group">
            <label for="total">Total</label>
            <input type="number" id="total" formControlName="total" readonly>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="observaciones">Observaciones</label>
            <textarea id="observaciones" formControlName="observaciones" rows="4"></textarea>
          </div>
        </div>

        <div class="form-buttons">
          <button type="submit" class="btn-primary">Calcular</button>
          <button type="button" class="btn-secondary">Limpiar</button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./cotizador.component.scss']
})
export class CotizadorComponent {
  cotizadorForm: FormGroup;
  submitted = false;

  // Precios por tipo de servicio
  precios: { [key: string]: number } = {
    basico: 100,
    estandar: 200,
    premium: 350
  };

  constructor(private fb: FormBuilder) {
    this.cotizadorForm = this.fb.group({
      servicio: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [{value: 0, disabled: true}],
      total: [{value: 0, disabled: true}],
      observaciones: ['']
    });

    // React to changes in servicio and cantidad
    this.cotizadorForm.get('servicio')?.valueChanges.subscribe(value => this.calcularPrecio());
    this.cotizadorForm.get('cantidad')?.valueChanges.subscribe(value => this.calcularPrecio());
  }

  get f() { return this.cotizadorForm.controls; }

  calcularPrecio() {
    const servicio = this.cotizadorForm.get('servicio')?.value;
    const cantidad = this.cotizadorForm.get('cantidad')?.value || 0;

    if (servicio && this.precios[servicio as string]) {
      const precioUnitario = this.precios[servicio as string];
      const total = precioUnitario * cantidad;

      this.cotizadorForm.patchValue({
        precio: precioUnitario,
        total: total
      });
    } else {
      this.cotizadorForm.patchValue({
        precio: 0,
        total: 0
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.cotizadorForm.invalid) {
      return;
    }

    // Process form data here
    console.log({
      ...this.cotizadorForm.getRawValue(),
      precio: this.cotizadorForm.get('precio')?.value,
      total: this.cotizadorForm.get('total')?.value
    });
  }
}
