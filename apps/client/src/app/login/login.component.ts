import {Component, inject, OnInit} from '@angular/core';
import {User} from '@ng-common/auth/models/user.model';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '@ng-common/auth/services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {finalize} from 'rxjs';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = new FormGroup({
    userName: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    rememberMe: new FormControl(false)
  });

  user: User = new User();
  returnUrl: string;
  loggingIn = false;

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
  }

  login() {
    console.log(this.loginForm);

    if (this.loginForm.valid) {
      this.loggingIn = true;
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
