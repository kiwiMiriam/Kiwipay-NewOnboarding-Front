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
    if (this.authService.isLoggedIn()) {
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
        this.toastService.success('¡Inicio de sesión exitoso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Credenciales inválidas. Por favor intente nuevamente.';
        this.errorMessage = errorMsg;
        this.toastService.error(errorMsg);
        console.error('Login error:', err);
      }
    });
  }
}
