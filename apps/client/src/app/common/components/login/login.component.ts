import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {finalize} from 'rxjs';
import {tap} from 'rxjs/operators';
import {IUser} from '@loomcore/common/models';
import { AsyncButtonDirective } from '@app/common/directives/async-button.directive';

import {AuthService} from '@ng-common/auth/services/auth.service';
import { BaseComponent } from '../base.component';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [RouterModule, ReactiveFormsModule],
})
export class LoginComponent extends BaseComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = new FormGroup({
    userName: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    rememberMe: new FormControl(false)
  });

  user?: IUser = undefined;
  returnUrl: string = '';
  loggingIn = false;

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
  }

  login() {
    console.log(this.loginForm);

    if (this.loginForm.valid) {
      this.loggingIn = true;
      // We handle the entire login flow outside of NgRx because we aim to make this framework-agnostic
      //  very soon. We should be able to do this in Angular or React very easily. In fact the entire thing
      //  should become pure html and javascript so that there is no Angular LoginComponent (just like Okta).
      //  With Okta, you just put their OktaAuthGuard on a route, and if there isn't an authenticated user,
      //  you automatically get redirected to their login page and redirected back to your intended destination
      //  upon successful login. (might have to rethink this so that apps can customize login)
      this.authService.login(this.loginForm.value.userName, this.loginForm.value.password)
        .pipe(
          tap((authState) => {
            if (authState) {
              // Okta and Auth0 handle redirecting to wherever you originally intended to go to via their callback components,
              //  so we need to handle redirection ourselves as well (outside of NgRx).
              if (authState && this.returnUrl) {
                this.router.navigate([this.returnUrl]);
              } else {
                this.router.navigate(['dashboard']);
              }
            }
            this.loggingIn = false;
          }),
          finalize(() => this.loggingIn = false)
        )
        .subscribe();
    } else {
      /**
       * Inform user that the form fields are invalid.
       */
    }
  }

}
