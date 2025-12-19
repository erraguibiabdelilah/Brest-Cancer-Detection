import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { UploadComponent } from './components/upload/upload.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'upload', component: UploadComponent },
  { path: '**', redirectTo: '' }
];
