import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_URL } from '../constants/api';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<any> {
    return this.http.get(`${BASE_URL}/users/${id}`, httpOptions)
  }

  updateUser(id: string, email: string, password: string): Observable<any> {
    return this.http.put(`${BASE_URL}/users/${id}`, { email, password }, httpOptions);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${BASE_URL}/users/${id}`);
  }
}
