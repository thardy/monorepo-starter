import { BasicAuthGuardService } from '@ng-common/auth/services/basic-auth-guard.service';
import { MemberListComponent } from './member-list/member-list.component';

export default [
  { path: '', component: MemberListComponent, canActivate: [BasicAuthGuardService] },
]; 