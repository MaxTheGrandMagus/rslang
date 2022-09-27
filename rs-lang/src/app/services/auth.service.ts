import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginUser, User } from '../models/user.model';
import { BASE_URL } from '../constants/api';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(user: LoginUser): Observable<any> {
    return this.http.post<LoginUser>(`${BASE_URL}/signin`, {
      email: user.email,
      password: user.password
    }, httpOptions);
  }

  register(user: User): Observable<any> {
    return this.http.post<User>(`${BASE_URL}/users`, {
      name: user.name,
      email: user.email,
      password: user.password
    }, httpOptions);
  }

  getNewUserTokens(id: string, refreshToken: string): Observable<any> {
    return this.http.get(`${BASE_URL}/users/${id}/tokens`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      })
    });
  }
}
