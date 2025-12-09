import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService } from '../../../../core/services/navigation.service';
import { ClinicalDataService } from '../../../../core/services/clinical-data.service';
import { MedicalCategory, Clinic, Branch, ClinicalData } from '../../../../core/services/prospecto-api.service';


@Component({
  selector: 'app-datos-clinica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datos-clinica.component.html',
  styleUrls: ['./datos-clinica.component.scss']
})
export class DatosClinicaComponent implements OnInit {
  clinicaForm: FormGroup;
  submitted = false;
  clientId: number | null = null;
  editMode = false;

  // Datos para los dropdowns
  categoriasMedicas: MedicalCategory[] = [];
  clinicas: Clinic[] = [];
  sedes: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService,
    private clinicalDataService: ClinicalDataService
  ) {
    this.clinicaForm = this.fb.group({
      categoriaMedica: ['', Validators.required],
      clinica: ['', Validators.required],
      sede: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Cargar categorías médicas al iniciar
    this.loadMedicalCategories();

    // Obtener clientId de query params
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.clientId = Number(id);
        this.loadClinicalData();
      }
    });
  }

  private loadMedicalCategories(): void {
    this.clinicalDataService.getMedicalCategories().subscribe({
      next: (categories) => {
        this.categoriasMedicas = categories;
      },
      error: (error) => {
        console.error('Error loading medical categories:', error);
      }
    });
  }

  private loadClinicalData(): void {
    if (!this.clientId) return;

    this.clinicalDataService.getClinicalDataByClientId(this.clientId).subscribe({
      next: (data) => {
        if (data) {
          this.editMode = true;
          
          // Cargar clínicas y sedes antes de aplicar valores
          if (data.categoriaMedica) {
            this.clinicalDataService.getClinicsByCategory(data.categoriaMedica).subscribe({
              next: (clinicas) => {
                this.clinicas = clinicas;
                
                if (data.clinica) {
                  this.clinicalDataService.getBranchesByClinic(data.clinica).subscribe({
                    next: (sedes) => {
                      this.sedes = sedes;
                      
                      // Ahora aplicar valores al formulario
                      this.clinicaForm.patchValue({
                        categoriaMedica: data.categoriaMedica,
                        clinica: data.clinica,
                        sede: data.sede
                      });
                    }
                  });
                }
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading clinical data:', error);
      }
    });
  }

  onCategoriaChange(): void {
    const categoryId = this.clinicaForm.get('categoriaMedica')?.value;
    
    if (categoryId) {
      this.clinicalDataService.getClinicsByCategory(categoryId).subscribe({
        next: (clinicas) => {
          this.clinicas = clinicas;
          // Reset dependent fields
          this.clinicaForm.patchValue({
            clinica: '',
            sede: ''
          });
          this.sedes = [];
        },
        error: (error) => {
          console.error('Error loading clinics:', error);
        }
      });
    } else {
      this.clinicas = [];
      this.sedes = [];
      this.clinicaForm.patchValue({
        clinica: '',
        sede: ''
      });
    }
  }

  onClinicaChange(): void {
    const clinicId = this.clinicaForm.get('clinica')?.value;
    
    if (clinicId) {
      this.clinicalDataService.getBranchesByClinic(clinicId).subscribe({
        next: (sedes) => {
          this.sedes = sedes;
          // Reset dependent field
          this.clinicaForm.patchValue({
            sede: ''
          });
        },
        error: (error) => {
          console.error('Error loading branches:', error);
        }
      });
    } else {
      this.sedes = [];
      this.clinicaForm.patchValue({
        sede: ''
      });
    }
  }

  get f() { return this.clinicaForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.clinicaForm.invalid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    if (!this.clientId) {
      alert('No se encontró el ID del cliente');
      return;
    }

    const formData = this.clinicaForm.value;
    const clinicalData: ClinicalData = {
      categoriaMedica: formData.categoriaMedica,
      clinica: formData.clinica,
      sede: formData.sede
    };

    if (this.editMode) {
      // Actualizar datos clínicos existentes
      this.clinicalDataService.actualizarClinicalData(this.clientId, clinicalData).subscribe({
        next: () => {
          alert('Datos clínicos actualizados exitosamente');
        },
        error: (error) => {
          console.error('Error updating clinical data:', error);
          alert('Error al actualizar datos clínicos');
        }
      });
    } else {
      // Crear nuevos datos clínicos
      this.clinicalDataService.crearClinicalData(this.clientId, clinicalData).subscribe({
        next: () => {
          this.editMode = true;
          alert('Datos clínicos guardados exitosamente');
        },
        error: (error) => {
          console.error('Error creating clinical data:', error);
          alert('Error al guardar datos clínicos');
        }
      });
    }
  }

  onCancel(): void {
    if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/dashboard/bandeja']);
    }
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
