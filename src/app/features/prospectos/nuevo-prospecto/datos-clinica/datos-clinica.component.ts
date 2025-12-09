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
      clinica: [{ value: '', disabled: true }, Validators.required],
      sede: [{ value: '', disabled: true }, Validators.required]
    });
  }

  ngOnInit(): void {
    // Cargar categorías médicas al iniciar
    this.loadMedicalCategories();

    // Obtener clientId de query params
    this.route.queryParams.subscribe(params => {
      console.log('Query params recibidos en datos-clinica:', params);
      const id = params['id'];
      console.log('ID extraído:', id);
      if (id) {
        this.clientId = Number(id);
        console.log('ClientId asignado:', this.clientId);
        this.loadClinicalData();
      } else {
        console.warn('No se encontró el parámetro "id" en la URL');
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
          console.log('Datos clínicos cargados:', data);
          
          // El backend devuelve IDs, así que usamos esos directamente
          const categoryId = data.medicalCategoryId;
          const clinicId = data.clinicId;
          const branchId = data.branchId;
          
          // Cargar clínicas basadas en la categoría
          if (categoryId) {
            this.clinicalDataService.getClinicsByCategory(categoryId).subscribe({
              next: (clinicas) => {
                this.clinicas = clinicas;
                this.clinicaForm.get('clinica')?.enable();
                
                // Cargar sedes basadas en la clínica
                if (clinicId) {
                  this.clinicalDataService.getBranchesByClinic(clinicId).subscribe({
                    next: (sedes) => {
                      this.sedes = sedes;
                      this.clinicaForm.get('sede')?.enable();
                      
                      // Aplicar valores al formulario
                      this.clinicaForm.patchValue({
                        categoriaMedica: categoryId,
                        clinica: clinicId,
                        sede: branchId
                      });
                    }
                  });
                } else {
                  // Solo cargar categoría y clínica
                  this.clinicaForm.patchValue({
                    categoriaMedica: categoryId,
                    clinica: clinicId
                  });
                }
              }
            });
          } else {
            // Solo aplicar la categoría
            this.clinicaForm.patchValue({
              categoriaMedica: categoryId
            });
          }
        }
      },
      error: (error) => {
        // 404 es esperado cuando no existen datos clínicos previos
        if (error.status === 404) {
          console.log('No se encontraron datos clínicos previos para este cliente');
          this.editMode = false;
        } else {
          console.error('Error loading clinical data:', error);
        }
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
          
          // Habilitar el control de clínica
          this.clinicaForm.get('clinica')?.enable();
          this.clinicaForm.get('sede')?.disable();
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
      
      // Deshabilitar controles dependientes
      this.clinicaForm.get('clinica')?.disable();
      this.clinicaForm.get('sede')?.disable();
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
          
          // Habilitar el control de sede
          this.clinicaForm.get('sede')?.enable();
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
      
      // Deshabilitar sede
      this.clinicaForm.get('sede')?.disable();
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
    
    // Enviar los IDs directamente del formulario (que ya contienen los IDs)
    const clinicalData = {
      medicalCategoryId: formData.categoriaMedica,
      clinicId: formData.clinica,
      branchId: formData.sede
    };

    console.log('Guardando datos clínicos:', clinicalData);

    if (this.editMode) {
      // Actualizar datos clínicos existentes
      this.clinicalDataService.actualizarClinicalData(this.clientId, clinicalData).subscribe({
        next: () => {
          alert('Datos clínicos actualizados exitosamente');
        },
        error: (error) => {
          console.error('Error updating clinical data:', error);
          alert('Error al actualizar datos clínicos: ' + (error.error?.message || error.message));
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
          alert('Error al guardar datos clínicos: ' + (error.error?.message || error.message));
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
   * Navega hacia atrás (datos-cliente) y actualiza el estado de la pestaña activa
   */
  navigateBack(): void {
    if (this.clientId) {
      this.router.navigate(['/dashboard/nuevo-prospecto/datos-cliente'], {
        queryParams: { id: this.clientId }
      });
    } else {
      this.router.navigate(['/dashboard/nuevo-prospecto/datos-cliente']);
    }
  }

  /**
   * Navega hacia adelante (cotizador) y actualiza el estado de la pestaña activa
   */
  navigateNext(): void {
    if (!this.clientId) {
      alert('No se encontró el ID del cliente');
      return;
    }
    
    // Navegar con el clientId en query params
    this.router.navigate(['/dashboard/nuevo-prospecto/cotizador'], {
      queryParams: { id: this.clientId }
    });
  }


}
