import {Component, inject, OnInit} from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { AppStore } from '@app/data/app.store';
import { headerComponentEvents } from '@ng-common/auth/data/auth.events';
import { NavComponent } from '../nav/nav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NavComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private appStore = inject(AppStore);
  private readonly dispatch = injectDispatch(headerComponentEvents);
  userContext = this.appStore.auth;
  
  ngOnInit(): void {
    console.log('Header initialized');
  }

  onLogout() {
    console.log('Dispatching logoutButtonClicked event');
    this.dispatch.logoutButtonClicked();
  }
}
