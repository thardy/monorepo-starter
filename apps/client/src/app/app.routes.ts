import { Routes } from '@angular/router';
import { BasicAuthGuardService } from '@ng-common/auth/services/basic-auth-guard.service';
import { DashboardComponent } from '@app/dashboard/dashboard.component';
import { LoginComponent } from '@common/components/login/login.component';
import { LogoutComponent } from '@common/components/logout/logout.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [BasicAuthGuardService] },
  { path: 'login', component: LoginComponent},
  { path: 'logout', component: LogoutComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
];
