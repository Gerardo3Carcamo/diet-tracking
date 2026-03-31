import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-confirm-email-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-email-page.component.html',
  styleUrl: './confirm-email-page.component.css'
})
export class ConfirmEmailPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage = '';
  infoMessage = '';
  simulatedCode: string | null = null;
  isSubmitting = false;

  ngOnInit(): void {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.form.controls.email.setValue(emailFromQuery);
    }
  }

  fetchSimulatedCode(): void {
    const email = this.form.controls.email.value;
    if (!email) {
      this.errorMessage = 'Primero escribe tu correo.';
      return;
    }

    this.simulatedCode = this.authService.getPendingConfirmationCode(email);
    if (!this.simulatedCode) {
      this.errorMessage = 'No hay codigo pendiente para ese correo.';
      this.infoMessage = '';
      return;
    }

    this.errorMessage = '';
    this.infoMessage = 'Se encontro un codigo pendiente (modo demo).';
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.infoMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, code } = this.form.getRawValue();
    this.isSubmitting = true;
    const result = await this.authService.confirmEmail(email, code);
    this.isSubmitting = false;

    if (!result.ok) {
      this.errorMessage = result.error ?? 'No fue posible confirmar el correo.';
      return;
    }

    await this.router.navigate(['/login'], { queryParams: { confirmed: '1' } });
  }
}
