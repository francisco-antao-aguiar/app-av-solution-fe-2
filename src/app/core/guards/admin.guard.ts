import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // Authenticated but not admin - redirect to weekly hours
    router.navigate(['/weekly-hours']);
  } else {
    // Not authenticated - redirect to login
    router.navigate(['/login']);
  }

  return false;
};
