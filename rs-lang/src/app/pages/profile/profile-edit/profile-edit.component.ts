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
  isLoaded = false;
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
      this.userService.getUser(this.userId).subscribe({
        next: (data: UserProfile) => {
          this.userData = structuredClone(data);
          this.form.email = this.userData.email;
          this.isLoaded = true;
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = err.message;
          this.toastr.error(this.errorMessage);
        }
      })
    }
  }

  onSubmit(): void {
    const { email, password, confirmPassword } = this.form;
    if (this.userId) {
      if (password === confirmPassword) {
        this.userService.updateUser(this.userId, email, password).subscribe({
          next: () => {
            this.router.navigate(['/profile'])
          },
          error: (err: HttpErrorResponse) => {
            this.errorMessage = err.message;
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
    this.isLoaded = false;
  }
}
