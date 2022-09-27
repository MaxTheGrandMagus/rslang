import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { lastValueFrom, Subscription, timer, take, fromEvent } from 'rxjs';
import { SprintGameService } from '../../../services/sprintgame.service';
import { StorageService } from '../../../services/storage.service';
import { StatisticsService } from '../../../services/statistics.service';
import { ResultFormComponent } from '../result-form/result-form.component';
import { Word } from '../../../models/words.model';
import { UserWord } from '../../../models/user-word.model';
import { UserAggregatedWord } from '../../../models/user-aggregated-word.model';
import { UserAggregatedWordResponse } from '../../../models/user-aggregated-word-response.model';
import { FooterService } from '../../components/footer/footer.service';
import { BASE_URL } from '../../../constants/api';

const GAME_TIME = 60;
const rightAnswerSound = '/assets/sounds/positive-beep.mp3';
const wrongAnswerSound = '/assets/sounds/negative-beep.mp3';

@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.scss'],
})
export class SprintComponent implements OnInit, OnDestroy {
  englishWord: string = '';
  russianWord: string | undefined = '';
  words: (Word | UserAggregatedWord)[] = [];
  currentWord?: Word | UserAggregatedWord;
  fakeWords: Word[] = [];
  isLogged: boolean = false;
  userId: string = '';
  fakeTranslate = false;
  score = 0;
  time = GAME_TIME;
  gameName = 'sprint';
  difficulty = 0;
  initialPage = 0;
  page = 0;
  cardsPerPage = 20;
  numberOfPages = 30;
  audio = '';
  results: (Word | UserAggregatedWord)[] = [];
  params?: { group?: string; page?: string };
  requestBody?: UserWord;
  isFromTextbook = false;
  isMistake = false;
  newWordCount = 0;
  correctSeries = 0;
  bestSeries: Array<number> = [];
  rightAnswers: UserAggregatedWord[] = [];
  wrongAnswers: UserAggregatedWord[] = [];
  isAllWordsAreLearned = false;
  timerSub?: Subscription;
  keyPressSub?: Subscription;
  flag = false;
  isAnswer = false;

  constructor(
    private sprintGameService: SprintGameService,
    private http: HttpClient,
    public dialog: MatDialog,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private statisticsService: StatisticsService,
    private footerService: FooterService
  ) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.isLogged = this.storageService.isLoggedIn();
    this.userId = this.storageService.getUser()?.userId || '';

    this.route.queryParams.pipe(take(1)).subscribe((value) => {
      this.params = value as { group?: string; page?: string };
      if (this.params.group) {
        this.isFromTextbook = true;
      }
    });

    if (this.isFromTextbook) {
      this.difficulty = Number(this.params?.group);
      this.page = this.initialPage = Number(this.params?.page);
      this.startGame();
    } else {
      this.sprintGameService.difficulty$.pipe(take(1)).subscribe((difficulty) => {
        this.difficulty = difficulty;
        this.startGame();
      });
    }

    this.footerService.hide();
  }

  startGame() {
    this.showWord();
    this.setGameTimer();
    this.startKeyboardControl();
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.keyPressSub?.unsubscribe();
    this.footerService.show();
  }

  startKeyboardControl() {
    this.keyPressSub = fromEvent(document, 'keydown').subscribe((e) => {
      if (!this.flag) {
        this.flag = true;

        if ((e as KeyboardEvent).key === "ArrowLeft") {
          this.checkAnswer('No');
        }

        if ((e as KeyboardEvent).key === "ArrowRight") {
          this.checkAnswer('Yes');
        }
      }
    });
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyboardUp(event: KeyboardEvent) {
    this.flag = false;
  }

  async getWord() {
    let wordsPage;
    if (this.isFromTextbook) {
      wordsPage = this.page;
    } else {
      wordsPage = Math.floor(Math.random() * (this.numberOfPages - 1));
    }

    if (this.words.length === 0) {
      if (this.userId) {
        const queryParams = `users/${this.userId}/aggregatedWords?group=${this.difficulty}&page=${wordsPage}&wordsPerPage=${this.cardsPerPage}`;
        const url = `${BASE_URL}/${queryParams}`;
        const data = this.http.get<UserAggregatedWordResponse[]>(url);
        const wordsReaponse = await lastValueFrom(data);

        if (this.isFromTextbook) {
          this.words = wordsReaponse[0].paginatedResults.filter((word) => word.userWord?.difficulty !== 'easy');
          if (this.words.length === 0 && this.isFromTextbook) {
            this.isAllWordsAreLearned = true;
            return;
          }
        } else {
          this.words = wordsReaponse[0].paginatedResults;
        }
      } else {
        const queryParams = `?group=${this.difficulty}&page=${wordsPage}`;
        const url = `${BASE_URL}/words${queryParams}`;
        const data = this.http.get<Word[]>(url);
        this.words = await lastValueFrom(data);
      }
      this.page -= 1;
    }

    const index = Math.floor(Math.random() * this.words.length);

    this.currentWord = this.words[index];
    const fakeTranslate = Math.floor(Math.random() * 2);

    if (!fakeTranslate) {

      let answer = '';

      while (answer === this.currentWord.wordTranslate || !answer) {
        const page = Math.floor(Math.random() * (this.numberOfPages - 1));
        const data = this.http.get<Word[]>(`${BASE_URL}/words?group=${this.difficulty}&page=${page}`);
        const fakeWords = await lastValueFrom(data);
        const fakeWord = Math.floor(Math.random() * (this.cardsPerPage - 1));
        answer = fakeWords[fakeWord].wordTranslate;
        this.currentWord.fakeTranslate = answer;
      }

    }
    this.words.splice(index, 1);
    return this.currentWord;
  }

  setGameTimer() {
    this.timerSub = timer(1000, 1000).subscribe(() => {
      if (this.time) {
        this.time--;
      } else {
        this.results.pop();
        this.gameOver();
      }
    });
  }

  async showWord() {
    const word = await this.getWord();

    if (!word) {
      this.gameOver();
    } else {
      this.results.push(word);
      this.audio = `${BASE_URL}/${word.audio}`;
      this.englishWord = word.word;

      if (word.fakeTranslate) {
        this.russianWord = word.fakeTranslate;
        this.fakeTranslate = true;
      } else {
        this.russianWord = word.wordTranslate;
        this.fakeTranslate = false;
      }
    }
  }

  checkAnswer(answer: string) {
    this.isAnswer = true;
    setTimeout(() => this.isAnswer = false, 300);

    const currentWord = this.currentWord as UserAggregatedWord;

    if (answer === 'Yes') {
      if (!this.fakeTranslate) {
        const sound = new Audio(rightAnswerSound);
        sound.play();

        this.results[this.results.length - 1].answer = true;
        this.isMistake = false;

        if (this.correctSeries <= 2) {
          this.score += 10;
        } else if (this.correctSeries > 2 && this.correctSeries <= 4) {
          this.score += 30;
        } else if (this.correctSeries > 4 && this.correctSeries <= 6) {
          this.score += 50;
        } else if (this.correctSeries > 6) {
          this.score += 70;
        }

        this.correctSeries++;
        this.rightAnswers.push(currentWord);
      } else {
        const sound = new Audio(wrongAnswerSound);
        sound.play();
        this.bestSeries.push(this.correctSeries);
        this.correctSeries = 0;
        this.isMistake = true;
        this.wrongAnswers.push(currentWord);
      }
    } else if (answer === 'No') {
      if (this.fakeTranslate) {
        if (this.correctSeries <= 2) {
          this.score += 10;
        } else if (this.correctSeries > 2 && this.correctSeries <= 4) {
          this.score += 30;
        } else if (this.correctSeries > 4 && this.correctSeries <= 6) {
          this.score += 50;
        } else if (this.correctSeries > 6) {
          this.score += 70;
        }

        this.results[this.results.length - 1].answer = true;
        const sound = new Audio(rightAnswerSound);
        sound.play();
        this.isMistake = false;
        this.correctSeries++;
        this.rightAnswers.push(currentWord);
      } else {
        const sound = new Audio(wrongAnswerSound);
        sound.play();
        this.isMistake = true;
        this.bestSeries.push(this.correctSeries);
        this.correctSeries = 0;
        this.wrongAnswers.push(currentWord);
      }
    }

    if (this.userId) {
      this.saveWordStats();
    }

    if (this.page < 0 && this.words.length === 0 && this.isFromTextbook) {
      this.gameOver();
    } else {
      this.showWord();
    }
  }

  saveWordStats() {
    const currentWord = this.currentWord as UserAggregatedWord;
    let isNewWord = !currentWord.userWord?.optional;

    if (isNewWord) {
      this.newWordCount++;
      if (currentWord.userWord?.difficulty) {
        this.requestBody = {
          ...currentWord.userWord,
          optional: { total: 1, success: this.isMistake ? 0 : 1, strike: this.isMistake ? 0 : 1 },
        };

        this.sprintGameService.updateUserWord(this.userId, currentWord._id, this.requestBody).subscribe();
      } else {
        this.requestBody = { optional: { total: 1, success: this.isMistake ? 0 : 1, strike: this.isMistake ? 0 : 1 } };
        this.sprintGameService.createUserWord(this.userId, currentWord._id, this.requestBody).subscribe();
      }
    } else {
      let currentTotal = currentWord.userWord?.optional?.total as number;
      let currentSuccess = currentWord.userWord?.optional?.success as number;
      let currentStrike = currentWord.userWord?.optional?.strike as number;

      currentStrike = this.isMistake ? 0 : ++currentStrike;
      if (
        (currentStrike > 2 && currentWord.userWord?.difficulty !== 'hard') ||
        (currentStrike > 4 && currentWord.userWord?.difficulty === 'hard')
        ) {
        this.requestBody = {
          ...currentWord.userWord,
          difficulty: 'easy',
          optional: {
            total: ++currentTotal,
            success: this.isMistake ? currentSuccess : ++currentSuccess,
            strike: currentStrike,
          },
        };
      } else if (this.isMistake && currentWord.userWord?.difficulty === 'easy') {
        this.requestBody = {
          optional: {
            total: ++currentTotal,
            success: this.isMistake ? currentSuccess : ++currentSuccess,
            strike: currentStrike,
          },
          difficulty: 'normal',
        };
      } else {
        this.requestBody = {
          ...currentWord.userWord,
          optional: {
            total: ++currentTotal,
            success: this.isMistake ? currentSuccess : ++currentSuccess,
            strike: currentStrike,
          },
        };
       }

      this.sprintGameService.updateUserWord(this.userId, currentWord._id, this.requestBody).subscribe();
    }
  }

  showResult() {
    this.sprintGameService.sendResult(this.results);
    this.openDialog();
  }

  getSound() {
    const sound = new Audio(this.audio);
    sound.play();
  }

  openDialog(): void {
    this.dialog.open(ResultFormComponent, {
      width: '700px',
      maxHeight: '85vh',
      data: {
        score: this.score,
        wrong: this.wrongAnswers.length,
        right: this.rightAnswers.length,
        allDone: this.isAllWordsAreLearned,
      },
      disableClose: true,
      panelClass: 'results-dialog-class'
    } as MatDialogConfig).afterClosed().pipe(take(1)).subscribe((result) => {
      if(result) {
        this.resetData();
        this.startGame();
      }
    });
  }

  saveGameStats() {
    const bestSeries = Math.max(...this.bestSeries);
    const successPercentage = Math.round((this.rightAnswers.length * 100) / this.results.length);

    this.statisticsService.setUserStatistics(
      this.rightAnswers,
      this.wrongAnswers,
      bestSeries,
      successPercentage,
      this.newWordCount,
      this.gameName
    );
  }

  gameOver() {
    this.timerSub?.unsubscribe();
    this.keyPressSub?.unsubscribe();
    this.bestSeries.push(this.correctSeries);
    this.showResult();
    if (this.userId) {
      this.saveGameStats();
    }
  }

  resetData() {
    this.page = this.initialPage;
    this.time = GAME_TIME;
    this.score = 0;
    this.words = [];
    this.results = [];
    this.newWordCount = 0;
    this.correctSeries = 0;
    this.isAllWordsAreLearned = false;
    this.bestSeries = [];
    this.rightAnswers = [];
    this.wrongAnswers = [];
  }
}
