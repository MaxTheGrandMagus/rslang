import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../../services/storage.service';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit, OnDestroy {
  isLoading = false;
  userId: string | undefined = '';
  userData: UserProfile = {
    id: '',
    name: '',
    email: ''
  };
  form: { email: string, password: string, confirmPassword: string } = {
    email: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage = '';

  constructor(
    private router: Router,
    private storageService: StorageService,
    private userService: UserService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser()?.userId;
    if (this.userId) {
      this.isLoading = true;
      this.userService.getUser(this.userId).subscribe({
        next: (data: UserProfile) => {
          this.isLoading = false;
          this.userData = structuredClone(data);
          this.form.email = this.userData.email;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = err.error;
          this.toastr.error(this.errorMessage);
        }
      })
    }
  }

  onSubmit(): void {
    const { email, password, confirmPassword } = this.form;
    if (this.userId) {
      this.isLoading = true;
      if (password === confirmPassword) {
        this.userService.updateUser(this.userId, email, password).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/profile'])
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            this.errorMessage = err.error;
            if (err.status === 403) {
              this.toastr.error('Incorrect e-mail or password');
            } else {
              this.toastr.error(this.errorMessage);
            }
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.isLoading = false;
  }
}
