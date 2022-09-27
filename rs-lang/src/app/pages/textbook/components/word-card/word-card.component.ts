import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Word } from 'src/app/pages/textbook/models/word.model';
import { UserAggregatedWord } from '../../models/user-aggregated-word.model';
import { BASE_URL } from '../../../../constants/api';

@Component({
  selector: 'app-word-card',
  templateUrl: './word-card.component.html',
  styleUrls: ['./word-card.component.scss']
})

export class WordCardComponent {

  @Input() word?: Word | UserAggregatedWord;
  @Input() isLogged?: boolean;
  @Input() isHardWordsChecked?: boolean;
  @Output() soundIconClick = new EventEmitter<Word | UserAggregatedWord>();
  @Output() hardWordClick = new EventEmitter<UserAggregatedWord>();
  @Output() hardWordDeleteClick = new EventEmitter<UserAggregatedWord>();
  @Output() learnedWordDeleteClick = new EventEmitter<UserAggregatedWord>();
  @Output() learnedWordAddClick = new EventEmitter<UserAggregatedWord>();

  onSoundIconClick(word?: Word | UserAggregatedWord): void {
    this.soundIconClick.emit(word);
  }

  onHardWordBtnAddClick(word?: UserAggregatedWord): void {
    this.hardWordClick.emit(word);
  }

  onHardWordDeleteClick(word?: UserAggregatedWord): void {
    this.hardWordDeleteClick.emit(word);
  }

  onLearnedWordAddClick(word?: UserAggregatedWord): void {
    this.learnedWordAddClick.emit(word);
  }

  onLearnedWordDeleteClick(word?: UserAggregatedWord): void {
    this.learnedWordDeleteClick.emit(word);
  }

  getImagePath() {
    return `${BASE_URL}/${this.word?.image}`;
  }

  getWrongAnswers() {
    const totalAnswers = this.word?.userWord?.optional?.total ?? 0;
    const rightAnswers = this.word?.userWord?.optional?.success ?? 0;
    return  totalAnswers - rightAnswers;
  }

}
