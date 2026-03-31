import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { MealEntry, NewMealPayload, ProfileSummary } from '../models/meal.model';
import { AuthService } from './auth.service';

interface ApiErrorResponse {
  message?: string;
}

interface ApiMealResponse {
  id: string;
  mainCourse: string;
  starter: string;
  drink: string;
  photoDataUrl: string;
  createdAtUtc: string;
}

interface ApiProfileResponse {
  userId: string;
  email: string;
  totalMeals: number;
  latestMeals: ApiMealResponse[];
}

@Injectable({ providedIn: 'root' })
export class MealService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  async createMeal(payload: NewMealPayload): Promise<MealEntry> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiMealResponse>(`${this.apiBaseUrl}/meals`, payload, {
          headers: this.getAuthHeaders()
        })
      );

      return this.mapMealResponse(response);
    } catch (error) {
      throw new Error(this.resolveApiError(error, 'No fue posible registrar la comida.'));
    }
  }

  async getMyMeals(): Promise<MealEntry[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiMealResponse[]>(`${this.apiBaseUrl}/meals`, {
          headers: this.getAuthHeaders()
        })
      );

      return response.map((meal) => this.mapMealResponse(meal));
    } catch (error) {
      throw new Error(this.resolveApiError(error, 'No fue posible cargar tus comidas.'));
    }
  }

  async getMyProfileSummary(): Promise<ProfileSummary> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiProfileResponse>(`${this.apiBaseUrl}/profile/me`, {
          headers: this.getAuthHeaders()
        })
      );

      this.authService.syncCurrentUserFromProfile(response.userId, response.email);

      return {
        userId: response.userId,
        email: response.email,
        totalMeals: response.totalMeals,
        latestMeals: response.latestMeals.map((meal) => this.mapMealResponse(meal))
      };
    } catch (error) {
      throw new Error(this.resolveApiError(error, 'No fue posible cargar tu perfil.'));
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    if (!token) {
      throw new Error('Tu sesion no es valida. Inicia sesion nuevamente.');
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private mapMealResponse(meal: ApiMealResponse): MealEntry {
    return {
      id: meal.id,
      mainCourse: meal.mainCourse,
      starter: meal.starter,
      drink: meal.drink,
      photoDataUrl: meal.photoDataUrl,
      createdAt: meal.createdAtUtc
    };
  }

  private resolveApiError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.authService.logout();
        return 'Tu sesion expiro. Inicia sesion nuevamente.';
      }

      const apiMessage = (error.error as ApiErrorResponse | undefined)?.message;
      if (apiMessage?.trim()) {
        return apiMessage;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
