import { computed, Injectable, signal } from '@angular/core';
import { AppUser } from '../models/user.model';

interface AuthResult {
  ok: boolean;
  error?: string;
  confirmationCode?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersStorageKey = 'diet-tracking.users';
  private readonly sessionStorageKey = 'diet-tracking.session-user-id';
  private readonly currentUserState = signal<AppUser | null>(this.getSessionUser());

  readonly currentUser = computed(() => this.currentUserState());
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  register(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    if (users.some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: 'Ya existe una cuenta con este correo.' };
    }

    const confirmationCode = this.generateConfirmationCode();
    const newUser: AppUser = {
      id: this.generateId(),
      email: normalizedEmail,
      password,
      emailConfirmed: false,
      confirmationCode,
      createdAt: new Date().toISOString()
    };

    this.saveUsers([...users, newUser]);

    return { ok: true, confirmationCode };
  }

  confirmEmail(email: string, code: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const userIndex = users.findIndex((user) => user.email === normalizedEmail);

    if (userIndex < 0) {
      return { ok: false, error: 'No encontramos una cuenta para ese correo.' };
    }

    const user = users[userIndex];
    if (user.emailConfirmed) {
      return { ok: true };
    }

    if (!code.trim() || user.confirmationCode !== code.trim()) {
      return { ok: false, error: 'El código de confirmación no es válido.' };
    }

    const updatedUser: AppUser = {
      ...user,
      emailConfirmed: true,
      confirmationCode: null
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);
    this.syncCurrentUser(updatedUser);

    return { ok: true };
  }

  login(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find((record) => record.email === normalizedEmail);

    if (!user || user.password !== password) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }

    if (!user.emailConfirmed) {
      return {
        ok: false,
        error: 'Debes confirmar tu correo antes de iniciar sesión.',
        confirmationCode: user.confirmationCode ?? undefined
      };
    }

    localStorage.setItem(this.sessionStorageKey, user.id);
    this.currentUserState.set(user);

    return { ok: true };
  }

  logout(): void {
    localStorage.removeItem(this.sessionStorageKey);
    this.currentUserState.set(null);
  }

  getUserById(userId: string): AppUser | null {
    return this.getUsers().find((user) => user.id === userId) ?? null;
  }

  getPendingConfirmationCode(email: string): string | null {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.getUsers().find((record) => record.email === normalizedEmail);
    return user?.confirmationCode ?? null;
  }

  private getSessionUser(): AppUser | null {
    const userId = localStorage.getItem(this.sessionStorageKey);
    if (!userId) {
      return null;
    }

    return this.getUserById(userId);
  }

  private syncCurrentUser(updatedUser: AppUser): void {
    const sessionUser = this.currentUserState();
    if (sessionUser?.id === updatedUser.id) {
      this.currentUserState.set(updatedUser);
    }
  }

  private getUsers(): AppUser[] {
    const usersRaw = localStorage.getItem(this.usersStorageKey);
    if (!usersRaw) {
      return [];
    }

    try {
      const users = JSON.parse(usersRaw) as AppUser[];
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: AppUser[]): void {
    localStorage.setItem(this.usersStorageKey, JSON.stringify(users));
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private generateConfirmationCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
