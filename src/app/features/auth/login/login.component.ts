import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  returnUrl: string = '/dashboard';
  showPassword: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    // Initialize form with validators
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }  get formControls() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark form controls as touched to trigger validation messages
      this.loginForm.markAllAsTouched();
      this.toastService.warning('Por favor, complete todos los campos correctamente.');
      return;
    }

    // Clear any previous error messages
    this.errorMessage = null;

    const credentials = {
      username: this.formControls['username'].value,
      password: this.formControls['password'].value
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('¡Inicio de sesión exitoso!');
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = response.message || 'Error de inicio de sesión';
          this.toastService.error(this.errorMessage);
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Ocurrió un error durante el inicio de sesión. Por favor intente nuevamente.';
        this.errorMessage = errorMsg;
        this.toastService.error(errorMsg);
      }
    });
  }
}
