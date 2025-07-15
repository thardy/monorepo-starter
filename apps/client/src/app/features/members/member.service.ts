import { GenericApiService } from '@common/services/generic-api.service';
import { IMember } from './member.model';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberService extends GenericApiService<IMember> {
  constructor() {
    super('members');
  }
} 