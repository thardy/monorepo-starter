import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import { AsyncButtonDirective } from '@app/common/directives/async-button.directive';

import { injectDispatch } from '@ngrx/signals/events';
import { BaseComponent } from '../base.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [RouterModule, AsyncButtonDirective],
  providers: [AppStore]
})
export class LoginComponent extends BaseComponent {
  private appStore = inject(AppStore);
  user = this.appStore.user;
  readonly dispatch = injectDispatch(loginPageEvents);
  
  constructor() {
    super();

    effect(() => {
      const currentUser = this.user();
      console.log(currentUser);
    });

    this.dispatch.opened();
  }

}
