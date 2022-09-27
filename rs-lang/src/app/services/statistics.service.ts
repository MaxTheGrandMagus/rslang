import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { StatisticByDate, Statistics, defaultStatistics, stringifiedNewBody } from '../models/statistics.model';
import { UserAggregatedWord } from '../models/user-aggregated-word.model';
import { isToday } from '../utils/statistics';
import { BASE_URL } from '../constants/api';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private getUserStatisticsResponse: stringifiedNewBody | null = null;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) { }

  getUserStatistics(id: string): Observable<any> {
    return this.http.get<stringifiedNewBody>(`${BASE_URL}/users/${id}/statistics`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.storageService.getToken()}`
      })
    })
  }

  updateUserStatistics(id: string, statistics: stringifiedNewBody): Observable<any> {
    return this.http.put(`${BASE_URL}/users/${id}/statistics`, statistics, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.storageService.getToken()}`
      })
    })
  }

  setUserStatistics(
    rightAnswers: UserAggregatedWord[],
    wrongAnswers: UserAggregatedWord[],
    bestStreak: number,
    rightPercent: number,
    newWordCount: number,
    gameName: string
  ) {
    const userId: string | undefined = this.storageService.getUser()?.userId;
    const token: string | null = this.storageService.getToken();
    if (userId && token) {
      this.getUserStatistics(userId).subscribe({
        next: (data: stringifiedNewBody) => {
          this.getUserStatisticsResponse = data;
          if (this.getUserStatisticsResponse) {
            const oldStatistics: stringifiedNewBody = structuredClone(this.getUserStatisticsResponse);
            const newStatistics: Statistics = {
              learnedWords: oldStatistics.learnedWords,
              optional: {
                allStatisticsByDate: JSON.parse(oldStatistics.optional.allStatisticsByDate),
              }
            };
            this.upsertUserStatistics(
              newStatistics,
              rightAnswers,
              wrongAnswers,
              bestStreak,
              rightPercent,
              newWordCount,
              gameName
            );
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 404) this.upsertUserStatistics(
            defaultStatistics,
            rightAnswers,
            wrongAnswers,
            bestStreak,
            rightPercent,
            newWordCount,
            gameName
          );
        }
      });
    }
  }

  upsertUserStatistics(
    oldbody: Statistics,
    rightAnswers: UserAggregatedWord[],
    wrongAnswers: UserAggregatedWord[],
    bestStreak: number,
    rightPercent: number,
    newWordCount: number,
    gameName: string
  ) {
    const userId: string | undefined = this.storageService.getUser()?.userId;
    const token: string | null = this.storageService.getToken();
    if (userId && token) {
      const newBody = structuredClone(oldbody);
      const allGameWords = [...rightAnswers, ...wrongAnswers];
      if (newBody.learnedWords === 0) { // if no statistics, then create statistics
        newBody.learnedWords = allGameWords.length;
        newBody.optional.allStatisticsByDate[0].date = new Date();
        newBody.optional.allStatisticsByDate[0].allWords = allGameWords.length;
        newBody.optional.allStatisticsByDate[0].allNewWords = newWordCount;
        newBody.optional.allStatisticsByDate[0].allWordsLearned = allGameWords.length;
        newBody.optional.allStatisticsByDate[0].allGamesRight = rightAnswers.length;
        newBody.optional.allStatisticsByDate[0].allGamesRightPercent = rightPercent;
        newBody.optional.allStatisticsByDate[0].allGamesWrong = wrongAnswers.length;
        if (gameName === 'sprint') {
          newBody.optional.allStatisticsByDate[0].games.sprint.right = rightAnswers.length;
          newBody.optional.allStatisticsByDate[0].games.sprint.rightPercent = rightPercent;
          newBody.optional.allStatisticsByDate[0].games.sprint.wrong = wrongAnswers.length;
          newBody.optional.allStatisticsByDate[0].games.sprint.bestStreak = bestStreak;
          newBody.optional.allStatisticsByDate[0].games.sprint.newWords = newWordCount;
        } else if (gameName === 'audioCall') {
          newBody.optional.allStatisticsByDate[0].games.audioCall.right = rightAnswers.length;
          newBody.optional.allStatisticsByDate[0].games.audioCall.rightPercent = rightPercent;
          newBody.optional.allStatisticsByDate[0].games.audioCall.wrong = wrongAnswers.length;
          newBody.optional.allStatisticsByDate[0].games.audioCall.bestStreak = bestStreak;
          newBody.optional.allStatisticsByDate[0].games.audioCall.newWords = newWordCount;
        }
      } else { // if there is some statistics of user
        const lastAllStatisticsByDateItem = newBody.optional.allStatisticsByDate.length; // last user statistic
        if (isToday(new Date(newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].date))) {
          if (gameName === 'sprint') {
            newBody.learnedWords += allGameWords.length;

            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allWords += allGameWords.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allNewWords += newWordCount;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allWordsLearned += allGameWords.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight += rightAnswers.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRightPercent =
              Number(
                ((newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight + rightAnswers.length)
                / (
                  (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight + rightAnswers.length)
                  + (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesWrong + wrongAnswers.length)
                ) * 100).toFixed(0)
              );
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesWrong += wrongAnswers.length;

            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.right += rightAnswers.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.rightPercent =
              Number(
                ((newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.right + rightAnswers.length)
                / (
                  (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.right + rightAnswers.length)
                  + (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.wrong + wrongAnswers.length)
                ) * 100).toFixed(0)
              );
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.wrong += wrongAnswers.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.bestStreak =
              newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.bestStreak < bestStreak
              ? bestStreak : newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.bestStreak;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.sprint.newWords += newWordCount;
          } else if (gameName === 'audioCall') {
            newBody.learnedWords += allGameWords.length;

            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allWords += allGameWords.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allNewWords += newWordCount;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allWordsLearned += allGameWords.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight += rightAnswers.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRightPercent =
              Number(
                ((newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight + rightAnswers.length)
                / (
                  (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesRight + rightAnswers.length)
                  + (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesWrong + wrongAnswers.length)
                ) * 100).toFixed(0)
              );
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allGamesWrong += wrongAnswers.length;

            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.right += rightAnswers.length;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.rightPercent =
              Number(
                ((newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.right + rightAnswers.length)
                / (
                  (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.right + rightAnswers.length)
                  + (newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.wrong + wrongAnswers.length)
                ) * 100).toFixed(0)
              );
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.wrong += wrongAnswers.length ;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.bestStreak =
              newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.bestStreak < bestStreak
              ? bestStreak : newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.bestStreak;
            newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].games.audioCall.newWords += newWordCount;
          }
        } else {
          newBody.learnedWords += allGameWords.length;
          const lastAllWords = newBody.optional.allStatisticsByDate[lastAllStatisticsByDateItem - 1].allWords;
          const newStatisticByDateItem: StatisticByDate = {
            date: new Date(),
            allWords: lastAllWords + allGameWords.length,
            allNewWords: newWordCount,
            allWordsLearned: allGameWords.length,
            allGamesRight: rightAnswers.length,
            allGamesRightPercent: rightPercent,
            allGamesWrong: wrongAnswers.length,
            games: {
              sprint: {
                right: 0,
                rightPercent: 0,
                wrong: 0,
                bestStreak: 0,
                newWords: 0,
              },
              audioCall: {
                right: 0,
                rightPercent: 0,
                wrong: 0,
                bestStreak: 0,
                newWords: 0,
              }
            }
          }
          if (gameName === 'sprint') {
            newStatisticByDateItem.games.sprint.right = rightAnswers.length;
            newStatisticByDateItem.games.sprint.rightPercent = rightPercent;
            newStatisticByDateItem.games.sprint.wrong = wrongAnswers.length;
            newStatisticByDateItem.games.sprint.bestStreak = bestStreak;
            newStatisticByDateItem.games.sprint.newWords = newWordCount;
          } else if (gameName === 'audioCall') {
            newStatisticByDateItem.games.audioCall.right = rightAnswers.length;
            newStatisticByDateItem.games.audioCall.rightPercent = rightPercent;
            newStatisticByDateItem.games.audioCall.wrong = wrongAnswers.length;
            newStatisticByDateItem.games.audioCall.bestStreak = bestStreak;
            newStatisticByDateItem.games.audioCall.newWords = newWordCount;
          }
          newBody.optional.allStatisticsByDate = [...newBody.optional.allStatisticsByDate, newStatisticByDateItem];
        }
      }
      const stringifiedNewBody: stringifiedNewBody = {
        learnedWords: newBody.learnedWords,
        optional: {
          allStatisticsByDate: JSON.stringify(newBody.optional.allStatisticsByDate),
        }
      }
      this.updateUserStatistics(userId, stringifiedNewBody).subscribe();
    }
  }
}
