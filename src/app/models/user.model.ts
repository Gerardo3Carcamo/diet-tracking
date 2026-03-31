export interface AppUser {
  id: string;
  email: string;
  password: string;
  emailConfirmed: boolean;
  confirmationCode: string | null;
  createdAt: string;
}
