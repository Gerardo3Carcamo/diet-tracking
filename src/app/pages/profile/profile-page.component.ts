import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MealEntry } from '../../models/meal.model';
import { AuthService } from '../../services/auth.service';
import { MealService } from '../../services/meal.service';

@Component({
  selector: 'app-profile-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly mealService = inject(MealService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  latestMeals: MealEntry[] = [];
  totalMeals = 0;
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    void this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const summary = await this.mealService.getMyProfileSummary();
      this.totalMeals = summary.totalMeals;
      this.latestMeals = summary.latestMeals;
    } catch (error) {
      this.totalMeals = 0;
      this.latestMeals = [];
      this.errorMessage = error instanceof Error ? error.message : 'No fue posible cargar tu perfil.';

      if (!this.authService.isAuthenticated()) {
        await this.router.navigate(['/login']);
      }
    } finally {
      this.isLoading = false;
    }
  }
}
