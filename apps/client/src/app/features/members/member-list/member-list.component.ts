import { Component, inject } from '@angular/core';
import { MembersStore } from '../data/members.store';
import { createCrudEvents } from '@ng-common/data/crud-events.factory';
import { IMember } from '../member.model';
import { injectDispatch } from '@ngrx/signals/events';

@Component({
  standalone: true,
  selector: 'member-list',
  templateUrl: './member-list.component.html',
  providers: [MembersStore]
})
export class MemberListComponent {
  private membersStore = inject(MembersStore);
  private memberEvents = createCrudEvents<IMember>('Member');
  readonly dispatch = injectDispatch(this.memberEvents.listPageEvents);

  // Store properties are automatically available from withCrud
  members = this.membersStore['memberEntities'];
  loading = this.membersStore.loading;
  loaded = this.membersStore.loaded;
  pagination = this.membersStore.pagination;

  constructor() {
    this.dispatch.opened();
  }

  onDelete(member: IMember) {
    this.dispatch.deleteButtonClicked(member.id.toString());
  }
} 