import { signalStore } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject, InjectionToken } from '@angular/core';
import { withCrud } from '@ng-common/data/with-crud.feature';
import { IMember } from '../member.model';
import { MemberService } from '../member.service';

// Create injection token for the MemberService
const MEMBER_SERVICE = new InjectionToken<MemberService>('MemberService', {
  providedIn: 'root',
  factory: () => inject(MemberService),
});

export const MembersStore = signalStore(
  { providedIn: 'root' },
  withCrud<IMember>({
    entityName: 'Member', // entityName is used for source naming on events. e.g. {entityName}List Page => MemberList Page
    collection: 'member', // changes store properties from ids, entityMap, and entities to memberIds, memberEntityMap, and memberEntities.
    selectId: (member) => member.id.toString(),
    serviceToken: MEMBER_SERVICE,
    pageSize: 10,
    enableErrorLogging: true,
  }),
  withDevtools('MembersStore')
); 