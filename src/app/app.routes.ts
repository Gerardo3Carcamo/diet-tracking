import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register-page.component').then((m) => m.RegisterPageComponent)
  },
  {
    path: 'confirmar-correo',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/confirm-email/confirm-email-page.component').then(
        (m) => m.ConfirmEmailPageComponent
      )
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/profile/profile-page.component').then((m) => m.ProfilePageComponent)
      },
      {
        path: 'registro-comida',
        loadComponent: () =>
          import('./pages/meal-form/meal-form-page.component').then((m) => m.MealFormPageComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'perfil' }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/perfil' },
  { path: '**', redirectTo: 'app/perfil' }
];
