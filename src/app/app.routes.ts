import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/auth/login.component';
import { LayoutComponent } from './shared/components/layout.component';
import { WeeklyHoursComponent } from './features/weekly-hours/weekly-hours.component';
import { MonthlyBuyComponent } from './features/monthly-buy/monthly-buy.component';
import { MonthlyProfitComponent } from './features/monthly-profit/monthly-profit.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'weekly-hours',
        pathMatch: 'full',
      },
      {
        path: 'weekly-hours',
        component: WeeklyHoursComponent,
      },
      {
        path: 'monthly-buy',
        component: MonthlyBuyComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'monthly-profit',
        component: MonthlyProfitComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'management',
        component: AdminComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
