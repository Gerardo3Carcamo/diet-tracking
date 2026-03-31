import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  readonly currentUser = this.authService.currentUser;

  latestMeals: MealEntry[] = [];
  totalMeals = 0;

  ngOnInit(): void {
    this.loadMeals();
  }

  private loadMeals(): void {
    const user = this.currentUser();
    if (!user) {
      this.latestMeals = [];
      this.totalMeals = 0;
      return;
    }

    const allMeals = this.mealService.getMealsByUser(user.id);
    this.totalMeals = allMeals.length;
    this.latestMeals = allMeals.slice(0, 5);
  }
}
