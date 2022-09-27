import { Component, OnInit, Inject, AfterViewChecked } from '@angular/core';
import { SprintGameService } from '../../../services/sprintgame.service';
import { Router } from '@angular/router';
import { Word } from '../../../models/words.model';
import { ResultData } from '../../../models/result-data.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BASE_URL } from '../../../constants/api';

@Component({
  selector: 'app-result-form',
  templateUrl: './result-form.component.html',
  styleUrls: ['./result-form.component.scss'],
})
export class ResultFormComponent implements OnInit, AfterViewChecked {
  results: Word[] = [];
  resultBtns?: NodeListOf<Element>;

  constructor(
    private router: Router,
    private sprintGameService: SprintGameService,
    @Inject(MAT_DIALOG_DATA) public data: ResultData,
    private matDialogRef: MatDialogRef<ResultFormComponent>
  ) {}

  ngOnInit(): void {
    this.sprintGameService.result$.subscribe((results) => {
      this.results = results;
    });
  }

  ngAfterViewChecked(): void {
    this.resultBtns = document.querySelectorAll('.result-btn');
  }

  playSound(soundLink: string) {
    const sound = new Audio(`${BASE_URL}/${soundLink}`);
    sound.play();
  }

  onRepeat() {
    this.matDialogRef.close(true);
  }

  goToGames() {
    this.matDialogRef.close();
    this.router.navigateByUrl('/games');
  }

  moveFocus(e: KeyboardEvent) {
    const activeBtn = document.activeElement;
    const activeBtnIndex = Array.prototype.indexOf.call(this.resultBtns, activeBtn);
    const resultBtnsLength = this.resultBtns?.length;

    if (resultBtnsLength) {
      if (e.key === "ArrowRight" && activeBtnIndex < resultBtnsLength - 1 ) {
        (activeBtn?.nextElementSibling as HTMLElement).focus();
      }

      if (e.key === "ArrowLeft" && activeBtnIndex > 0) {
        (activeBtn?.previousElementSibling as HTMLElement).focus();
      }
    }
  }
}
