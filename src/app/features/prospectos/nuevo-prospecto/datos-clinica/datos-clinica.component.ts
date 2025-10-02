import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-datos-clinica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="section-container">
      <h3>Datos de la Clínica</h3>

      <form [formGroup]="clinicaForm" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <div class="form-group">
            <label for="nombreClinica">Nombre de la Clínica</label>
            <input type="text" id="nombreClinica" formControlName="nombreClinica">
            @if (submitted && f['nombreClinica'].errors) {
              <div class="error-message">El nombre de la clínica es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="direccion">Dirección</label>
            <input type="text" id="direccion" formControlName="direccion">
            @if (submitted && f['direccion'].errors) {
              <div class="error-message">La dirección es requerida</div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="telefono">Teléfono</label>
            <input type="tel" id="telefono" formControlName="telefono">
            @if (submitted && f['telefono'].errors) {
              <div class="error-message">El teléfono es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email">
            @if (submitted && f['email'].errors) {
              <div class="error-message">
                @if (f['email'].errors['required']) {
                  El email es requerido
                } @else if (f['email'].errors['email']) {
                  Debe ingresar un email válido
                }
              </div>
            }
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="responsable">Nombre del Responsable</label>
            <input type="text" id="responsable" formControlName="responsable">
            @if (submitted && f['responsable'].errors) {
              <div class="error-message">El nombre del responsable es requerido</div>
            }
          </div>

          <div class="form-group">
            <label for="horario">Horario de Atención</label>
            <input type="text" id="horario" formControlName="horario">
          </div>
        </div>

        <div class="form-buttons">
          <button type="submit" class="btn-primary">Guardar</button>
          <button type="button" class="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./datos-clinica.component.scss']
})
export class DatosClinicaComponent {
  clinicaForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.clinicaForm = this.fb.group({
      nombreClinica: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      responsable: ['', Validators.required],
      horario: ['']
    });
  }

  get f() { return this.clinicaForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.clinicaForm.invalid) {
      return;
    }

    // Process form data here
    console.log(this.clinicaForm.value);
  }
}
