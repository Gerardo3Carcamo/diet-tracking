import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  errorMessage = '';
  infoMessage = '';
  pendingCode: string | null = null;
  isSubmitting = false;

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('confirmed') === '1') {
      this.infoMessage = 'Correo confirmado correctamente. Ya puedes iniciar sesion.';
    }
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.pendingCode = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email, password } = this.form.getRawValue();
    const result = await this.authService.login(email, password);
    this.isSubmitting = false;

    if (!result.ok) {
      this.errorMessage = result.error ?? 'No fue posible iniciar sesion.';
      this.pendingCode = result.confirmationCode ?? null;
      return;
    }

    await this.router.navigate(['/app/perfil']);
  }

  goToConfirmation(): void {
    const email = this.form.controls.email.value;
    void this.router.navigate(['/confirmar-correo'], { queryParams: { email } });
  }
}
