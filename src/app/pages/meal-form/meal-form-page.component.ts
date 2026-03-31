import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MealService } from '../../services/meal.service';

@Component({
  selector: 'app-meal-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './meal-form-page.component.html',
  styleUrl: './meal-form-page.component.css'
})
export class MealFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mealService = inject(MealService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    mainCourse: ['', Validators.required],
    starter: ['', Validators.required],
    drink: ['', Validators.required],
    photoDataUrl: ['', Validators.required]
  });

  errorMessage = '';
  imagePreview: string | null = null;
  isSaving = false;

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'El archivo debe ser una imagen.';
      this.form.controls.photoDataUrl.setValue('');
      this.imagePreview = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? '';
      this.form.controls.photoDataUrl.setValue(result);
      this.imagePreview = result;
      this.errorMessage = '';
    };
    reader.readAsDataURL(file);
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa todos los campos y sube una foto.';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      await this.router.navigate(['/login']);
      return;
    }

    this.isSaving = true;
    try {
      await this.mealService.createMeal(this.form.getRawValue());
      await this.router.navigate(['/app/perfil']);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'No fue posible registrar la comida.';

      if (!this.authService.isAuthenticated()) {
        await this.router.navigate(['/login']);
      }
    } finally {
      this.isSaving = false;
    }
  }
}
