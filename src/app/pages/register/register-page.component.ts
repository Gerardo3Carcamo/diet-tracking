import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css'
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage = '';
  generatedCode: string | null = null;
  registeredEmail: string | null = null;

  submit(): void {
    this.errorMessage = '';
    this.generatedCode = null;
    this.registeredEmail = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    const result = this.authService.register(email, password);
    if (!result.ok) {
      this.errorMessage = result.error ?? 'No fue posible registrar la cuenta.';
      return;
    }

    this.generatedCode = result.confirmationCode ?? null;
    this.registeredEmail = email;
  }

  goToConfirmation(): void {
    this.router.navigate(['/confirmar-correo'], {
      queryParams: { email: this.registeredEmail }
    });
  }
}
