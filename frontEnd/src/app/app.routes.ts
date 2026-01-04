import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { Dashboard } from './components/dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
