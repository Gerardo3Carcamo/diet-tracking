import { Injectable } from '@angular/core';
import { MealEntry, NewMealPayload } from '../models/meal.model';

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly mealsStorageKey = 'diet-tracking.meals';

  createMeal(userId: string, payload: NewMealPayload): MealEntry {
    const meal: MealEntry = {
      id: this.generateId(),
      userId,
      mainCourse: payload.mainCourse.trim(),
      starter: payload.starter.trim(),
      drink: payload.drink.trim(),
      photoDataUrl: payload.photoDataUrl,
      createdAt: new Date().toISOString()
    };

    const meals = this.getAllMeals();
    meals.push(meal);
    this.saveAllMeals(meals);

    return meal;
  }

  getMealsByUser(userId: string): MealEntry[] {
    return this.getAllMeals()
      .filter((meal) => meal.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getLatestMealsByUser(userId: string, limit = 5): MealEntry[] {
    return this.getMealsByUser(userId).slice(0, limit);
  }

  private getAllMeals(): MealEntry[] {
    const mealsRaw = localStorage.getItem(this.mealsStorageKey);
    if (!mealsRaw) {
      return [];
    }

    try {
      const meals = JSON.parse(mealsRaw) as MealEntry[];
      return Array.isArray(meals) ? meals : [];
    } catch {
      return [];
    }
  }

  private saveAllMeals(meals: MealEntry[]): void {
    localStorage.setItem(this.mealsStorageKey, JSON.stringify(meals));
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
