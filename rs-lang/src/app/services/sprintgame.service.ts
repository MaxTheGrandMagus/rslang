import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Word } from '../models/words.model';
import { UserAggregatedWord } from '../models/user-aggregated-word.model';
import { UserWordResponse } from '../models/user-word-response.model';
import { UserWord } from '../models/user-word.model';
import { BASE_URL } from '../constants/api';

@Injectable({
  providedIn: 'root'
})
export class SprintGameService {
  constructor(private http: HttpClient) {}

  public difficulty$ = new Subject<number>();

  public changeDifficulty(difficulty: number) {
    this.difficulty$.next(difficulty);
  }

  public result$ = new BehaviorSubject<any>(false);
  result = this.result$.asObservable();

  public sendResult(result: Word[] | UserAggregatedWord[]) {
    this.result$.next(result);
  }

  createUserWord(userId: string, wordId: string | undefined, params: UserWord): Observable<UserWordResponse> {
    const queryParams = `users/${userId}/words/${wordId}`;
    const url = `${BASE_URL}/${queryParams}`;
    return this.http.post<UserWordResponse>(url, params);
  }

  updateUserWord(userId: string, wordId: string | undefined, params: UserWord): Observable<UserWordResponse> {
    const queryParams = `users/${userId}/words/${wordId}`;
    const url = `${BASE_URL}/${queryParams}`;
    return this.http.put<UserWordResponse>(url, params);
  }

}
