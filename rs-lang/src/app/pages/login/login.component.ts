import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { ToastrService } from 'ngx-toastr';
import { UserTokenResponse, LoginUser } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  isLoading = false;
  form: LoginUser = {
    email: '',
    password: ''
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private storageService: StorageService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    const { email, password } = this.form;
    this.isLoading = true;
    this.authService.login({ email, password }).subscribe({
      next: (data: UserTokenResponse) => {
        this.storageService.saveToken(data.token)
        this.storageService.saveRefreshToken(data.refreshToken)
        this.storageService.saveUser(data);
        this.isLoginFailed = false;
        this.isLoggedIn = true;
        this.isLoading = false;
        this.navigateAndReload();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.isLoginFailed = true;
        this.errorMessage = err.error;
        this.toastr.error(this.errorMessage);
      }
    });
  }

  navigateAndReload(): void {
    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }
}
