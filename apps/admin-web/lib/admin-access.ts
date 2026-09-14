export const ADMIN_PASSWORD_MIN_LENGTH = 8;

export function isAdminPasswordValid(password: string): boolean {
  return password.length >= ADMIN_PASSWORD_MIN_LENGTH
    && /\p{L}/u.test(password)
    && /\p{N}/u.test(password);
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password.length > 0 && password === confirmation;
}

export function isExactFranchiseName(value: string, franchiseName: string): boolean {
  return value === franchiseName;
}

export function normalizeAdministrativeEmail(email: string): string {
  return email.trim().toLowerCase();
}
