import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationService } from '../../../../core/services/navigation.service'


@Component({
  selector: 'app-datos-clinica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-clinica.component.html',
  styleUrls: ['./datos-clinica.component.scss']
})
export class DatosClinicaComponent {
  clinicaForm: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private navigationService: NavigationService) {
    this.clinicaForm = this.fb.group({
      categoriaMedica: [''],
      clinica: [''],
      sede: [''],
      ingresos: ['', Validators.required],
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

  /**
   * Navega hacia atrás (datos-clinicas) y actualiza el estado de la pestaña activa
   */
  navigateBack(): void {
    // Usa el servicio de navegación para navegar hacia atrás desde la pestaña actual
    this.navigationService.navigateToTab('datos-cliente');
  }

  /**
   * Navega hacia adelante (documentos) y actualiza el estado de la pestaña activa
   */
  navigateNext(): void {
    // Usa el servicio de navegación para navegar hacia adelante desde la pestaña actual
    this.navigationService.navigateToTab('cotizador');
  }


}
