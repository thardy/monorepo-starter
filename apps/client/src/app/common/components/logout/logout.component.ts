import { Component } from '@angular/core';
import {RouterModule} from '@angular/router';

@Component({
  standalone: true,
  template: `
        <div>
            You have been successfully logged out. Click <a [routerLink]="['/dashboard']">here</a> to return to the application
        </div>
    `,
  imports: [ RouterModule ]
})
export class LogoutComponent {}
