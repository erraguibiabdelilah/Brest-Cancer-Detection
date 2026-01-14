import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { Dashboard } from './components/dashboard/dashboard';
import { DashboardHomeComponent } from './components/dashboard/dashboard-home.component';
import { UploadComponent } from './components/upload/upload.component';
import { HistoryComponent } from './components/history/history.component';
import { ProfileComponent } from './components/profile/profile';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashboardHomeComponent },
      { path: 'analyse', component: UploadComponent },
      { path: 'historique', component: HistoryComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
