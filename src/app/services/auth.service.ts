import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUser } from '../models/user.model';

interface AuthResult {
  ok: boolean;
  error?: string;
  confirmationCode?: string;
}

interface ApiErrorResponse {
  message?: string;
}

interface RegisterApiResponse {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  confirmationCode: string;
}

interface LoginApiResponse {
  token: string;
  userId: string;
  email: string;
  emailConfirmed: boolean;
  isAdminBypassUser: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly sessionUserStorageKey = 'diet-tracking.session-user';
  private readonly authTokenStorageKey = 'diet-tracking.auth-token';
  private readonly pendingCodeStorageKey = 'diet-tracking.pending-confirmation-codes';

  private readonly currentUserState = signal<AppUser | null>(this.getStoredSessionUser());
  private readonly authTokenState = signal<string | null>(this.getStoredAuthToken());

  readonly currentUser = computed(() => this.currentUserState());
  readonly isAuthenticated = computed(() => !!this.currentUserState() && !!this.authTokenState());

  constructor() {
    if (!this.currentUserState() || !this.authTokenState()) {
      this.clearSession();
    }
  }

  async register(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<RegisterApiResponse>(`${this.apiBaseUrl}/auth/register`, {
          email: email.trim().toLowerCase(),
          password
        })
      );

      this.savePendingConfirmationCode(response.email, response.confirmationCode);
      return { ok: true, confirmationCode: response.confirmationCode };
    } catch (error) {
      return {
        ok: false,
        error: this.extractErrorMessage(error, 'No fue posible registrar la cuenta.')
      };
    }
  }

  async confirmEmail(email: string, code: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      await firstValueFrom(
        this.http.post(`${this.apiBaseUrl}/auth/confirm-email`, {
          email: normalizedEmail,
          code: code.trim()
        })
      );

      this.clearPendingConfirmationCode(normalizedEmail);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: this.extractErrorMessage(error, 'No fue posible confirmar el correo.')
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await firstValueFrom(
        this.http.post<LoginApiResponse>(`${this.apiBaseUrl}/auth/login`, {
          email: normalizedEmail,
          password
        })
      );

      const user: AppUser = {
        id: response.userId,
        email: response.email,
        emailConfirmed: response.emailConfirmed,
        isAdminBypassUser: response.isAdminBypassUser
      };

      this.persistSession(user, response.token);
      return { ok: true };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error, 'No fue posible iniciar sesion.');
      const confirmationCode = errorMessage.toLowerCase().includes('confirm')
        ? this.getPendingConfirmationCode(normalizedEmail) ?? undefined
        : undefined;

      return {
        ok: false,
        error: errorMessage,
        confirmationCode
      };
    }
  }

  logout(): void {
    this.clearSession();
  }

  getAuthToken(): string | null {
    return this.authTokenState();
  }

  syncCurrentUserFromProfile(userId: string, email: string): void {
    const normalizedEmail = email.trim().toLowerCase();
    const currentUser = this.currentUserState();

    if (!currentUser) {
      return;
    }

    if (currentUser.id === userId && currentUser.email === normalizedEmail) {
      return;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      id: userId,
      email: normalizedEmail
    };

    this.currentUserState.set(updatedUser);
    localStorage.setItem(this.sessionUserStorageKey, JSON.stringify(updatedUser));
  }

  getPendingConfirmationCode(email: string): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    const pendingCodes = this.getPendingConfirmationCodes();
    return pendingCodes[normalizedEmail] ?? null;
  }

  private persistSession(user: AppUser, token: string): void {
    this.currentUserState.set(user);
    this.authTokenState.set(token);
    localStorage.setItem(this.sessionUserStorageKey, JSON.stringify(user));
    localStorage.setItem(this.authTokenStorageKey, token);
  }

  private clearSession(): void {
    this.currentUserState.set(null);
    this.authTokenState.set(null);
    localStorage.removeItem(this.sessionUserStorageKey);
    localStorage.removeItem(this.authTokenStorageKey);
  }

  private getStoredSessionUser(): AppUser | null {
    const storedUser = localStorage.getItem(this.sessionUserStorageKey);
    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser) as AppUser;
      return user?.id && user?.email ? user : null;
    } catch {
      return null;
    }
  }

  private getStoredAuthToken(): string | null {
    return localStorage.getItem(this.authTokenStorageKey);
  }

  private getPendingConfirmationCodes(): Record<string, string> {
    const rawValue = localStorage.getItem(this.pendingCodeStorageKey);
    if (!rawValue) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawValue) as Record<string, string>;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private savePendingConfirmationCode(email: string, code: string): void {
    const pendingCodes = this.getPendingConfirmationCodes();
    pendingCodes[email.trim().toLowerCase()] = code;
    localStorage.setItem(this.pendingCodeStorageKey, JSON.stringify(pendingCodes));
  }

  private clearPendingConfirmationCode(email: string): void {
    const pendingCodes = this.getPendingConfirmationCodes();
    delete pendingCodes[email.trim().toLowerCase()];
    localStorage.setItem(this.pendingCodeStorageKey, JSON.stringify(pendingCodes));
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = (error.error as ApiErrorResponse | undefined)?.message;
      if (apiMessage?.trim()) {
        return apiMessage;
      }
    }

    return fallbackMessage;
  }
}
