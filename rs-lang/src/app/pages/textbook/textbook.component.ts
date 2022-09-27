import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from './models/category.model';
import { Word } from './models/word.model';
import { UserAggregatedWord } from './models/user-aggregated-word.model';
import { UserWord } from './models/user-word.model';
import { UserWordResponse } from './models/user-word-response.model';
import { CategoryService } from './services/category.service';
import { WordService } from './services/word.service';
import { StorageService } from 'src/app/services/storage.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BASE_URL } from '../../constants/api';

@Component({
  selector: 'app-textbook',
  templateUrl: './textbook.component.html',
  styleUrls: ['./textbook.component.scss'],
})
export class TextbookComponent implements OnInit, OnDestroy, AfterViewInit {
  categories?: Category[];
  words: (Word | UserAggregatedWord)[] = [];
  userWords: UserWord[] = [];
  category: number = Number(localStorage.getItem('textbookCategory')) || 0;
  page: number = Number(localStorage.getItem('textbookPage')) || 0;
  totalWords = 600;
  cardsPerPage = 20;
  audio = new Audio();
  soundsToPlay?: Array<string>;
  isLogged: boolean = false;
  userId: string = '';
  learnedWords: number = 0;
  isHardWordsChecked = localStorage.getItem('isHardWordsChecked') === 'true' || false;
  requestBody?: UserWord;
  paginatorLabel?: HTMLElement;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private categoryService: CategoryService,
    private wordService: WordService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLogged = this.storageService.isLoggedIn();
    this.userId = this.storageService.getUser()?.userId || '';
    if (this.userId) {
      this.isHardWordsChecked ? this.getUserAggregatedHardWords() : this.getUserAggregatedWords();
    } else {
      this.getWords();
    }
    this.getCategories();
  }

  ngOnDestroy(): void {
    this.audio.pause();
  }

  ngAfterViewInit(): void {
    if (!this.isHardWordsChecked) {
      const paginatorIntl = this.paginator._intl;
      paginatorIntl.nextPageLabel = 'Следующая страница';
      paginatorIntl.previousPageLabel = 'Предыдущая страница';
      paginatorIntl.lastPageLabel = 'Последняя страница';
      paginatorIntl.firstPageLabel = 'Первая страница';
    }
  }

  getCategories(): void {
    this.categories = this.categoryService.getCategories();
  }

  onCategoryChanged(category: number) {
    this.category = category;
    this.page = 0;
    localStorage.setItem('textbookCategory', this.category.toString());
    localStorage.setItem('textbookPage', this.page.toString());
    this.audio.pause();

    if (this.userId) {
      this.getUserAggregatedWords();
    } else {
      this.getWords();
    }
  }

  getWords(): void {
    this.isLoading = true;
    this.wordService.getWords(this.category, this.page).subscribe((words) => {
      this.words = words;
      this.isLoading = false;
    });
  }

  getUserAggregatedWords(): void {
    this.isLoading = true;
    this.wordService
      .getUserAggregatedWords(this.userId, this.category, this.page, this.cardsPerPage)
      .subscribe((words) => {
        this.isLoading = false;
        this.calculateLearnedWords(words[0].paginatedResults);
        this.words = words[0].paginatedResults;
      });
  }

  getUserAggregatedHardWords(): void {
    this.isLoading = true;
    this.wordService.getUserAggregatedHardWords(this.userId).subscribe((words) => {
      this.isLoading = false;
      this.calculateLearnedWords(words[0].paginatedResults);
      this.words = words[0].paginatedResults;
    });
  }

  onPageChanged(pageData: PageEvent) {
    this.page = pageData.pageIndex;
    this.audio.pause();
    localStorage.setItem('textbookPage', this.page.toString());
    if (this.userId) {
      this.getUserAggregatedWords();
    } else {
      this.getWords();
    }
  }

  onSoundIconClick(word: Word): void {
    this.soundsToPlay = [
      `${BASE_URL}/${word.audio}`,
      `${BASE_URL}/${word.audioMeaning}`,
      `${BASE_URL}/${word.audioExample}`,
    ];
    this.playSounds(this.soundsToPlay);
  }

  playSounds(sounds: Array<string>) {
    let count = 1;
    this.audio.src = sounds[0];
    this.audio.play();

    this.audio.onended = () => {
      if (count < sounds.length) {
        this.audio.src = sounds[count];
        this.audio.play();
        count++;
      }
    };
  }

  getUserWords(): void {
    this.wordService.getUserWords(this.userId).subscribe((userWords) => {
      this.userWords = userWords;
    });
  }

  addHardWord(word: UserAggregatedWord): void {
    if (word.userWord) {
      this.requestBody = { ...word.userWord, difficulty: 'hard' };
      this.wordService.updateUserWord(this.userId, word._id, this.requestBody).subscribe((data) => {
        this.updateCurrentWordList(word, data, 'hard');
        this.calculateLearnedWords(this.words);
      });
    } else {
      this.requestBody = { difficulty: 'hard' };
      this.wordService.addToHard(this.userId, word._id, this.requestBody).subscribe((data) => {
        this.updateCurrentWordList(word, data, 'hard');
        this.calculateLearnedWords(this.words);
      });
    }
  }

  addLearnedWord(word: UserAggregatedWord): void {
    if (word.userWord) {
      this.requestBody = { ...word.userWord, difficulty: 'easy' };
      this.wordService.updateUserWord(this.userId, word._id, this.requestBody).subscribe((data) => {
        if (this.isHardWordsChecked) {
          const wordsUpdated = this.words.filter((item: UserAggregatedWord) => item._id !== word._id);
          this.words = wordsUpdated;
        } else {
          this.updateCurrentWordList(word, data, 'easy');
          this.calculateLearnedWords(this.words);
        }
      });
    } else {
      this.requestBody = { difficulty: 'easy' };
      this.wordService.addToLearned(this.userId, word._id, this.requestBody).subscribe((data) => {
        this.updateCurrentWordList(word, data, 'easy');
        this.calculateLearnedWords(this.words);
      });
    }
  }

  deleteHardWord(word: UserAggregatedWord): void {
    this.requestBody = { optional: word.userWord?.optional, difficulty: 'normal' };
    this.wordService.updateUserWord(this.userId, word._id, this.requestBody).subscribe(() => {
      const wordsUpdated = this.words.filter((item: UserAggregatedWord) => item._id !== word._id);
      this.words = wordsUpdated;
    });
  }

  deleteLearnedWord(word: UserAggregatedWord): void {
    this.requestBody = { optional: word.userWord?.optional, difficulty: 'normal' };
    this.wordService.updateUserWord(this.userId, word._id, this.requestBody).subscribe((data) => {
      this.updateCurrentWordList(word, data, 'normal');
      this.calculateLearnedWords(this.words);
    });
  }

  updateCurrentWordList(word: UserAggregatedWord, data: UserWordResponse, difficulty: string) {
    const updatedUserWord = { ...word.userWord, difficulty };
    const updatedWord = { ...word, userWord: updatedUserWord };
    const wordsUpdated = this.words.map((word: UserAggregatedWord) => {
      return word._id === data.wordId ? updatedWord : word;
    });
    this.words = wordsUpdated;
  }

  calculateLearnedWords(words: UserAggregatedWord[]) {
    this.learnedWords = words.filter((word) => word.userWord?.difficulty === 'easy').length;
  }

  showHardWords($event: MatSlideToggleChange) {
    this.isHardWordsChecked = $event.checked;
    this.audio.pause();
    localStorage.setItem('isHardWordsChecked', JSON.stringify(this.isHardWordsChecked));
    if (this.isHardWordsChecked) {
      this.getUserAggregatedHardWords();
    } else {
      this.getUserAggregatedWords();
    }
  }

  onSprintGameBtnClick() {
    this.router.navigateByUrl(`/games/sprint?group=${this.category}&page=${this.page}`);

  }
  onAudioGameBtnClick() {
    this.router.navigateByUrl(`/games/audio-call?group=${this.category}&page=${this.page}`);
  }
}
