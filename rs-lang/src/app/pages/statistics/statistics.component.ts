import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { StatisticsService } from '../../services/statistics.service';
import { StorageService } from '../../services/storage.service';
import { Statistics, stringifiedNewBody, TodayStatistics, TodayStatisticsGame } from '../../models/statistics.model';
import { isToday } from './../../utils/statistics';
import { ChartDataset, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  isLoading = false;
  userId: string | undefined = ''
  errorMessage = '';
  statisticsData: Statistics = {
    learnedWords: 0,
    optional: {
      allStatisticsByDate: [],
    }
  }
  todayStatistics: TodayStatistics = {
    allNewWords: 0,
    allWordsLearned: 0,
    allGamesRightPercent: 0
  }
  todayStatisticsSprint: TodayStatisticsGame = {
    newWords: 0,
    rightPercent: 0,
    bestStreak: 0
  }
  todayStatisticsAudioCall: TodayStatisticsGame = {
    newWords: 0,
    rightPercent: 0,
    bestStreak: 0
  }
  allTimeStatistics: {
    date: Date,
    allWords: number,
    allNewWords: number,
  }[] = [];
  allTimeStatisticsDate: string[] = [];
  allTimeStatisticsAllWords: number[] = [];
  allTimeStatisticsAllNewWords: number[] = [];

  public barChartData: ChartDataset[] = [{
    label: 'Новых слов',
    data: [],
    fill: true,
    tension: 0.5,
    borderColor: '#804399',
    backgroundColor: '#cfc0fb'
  }];
  public barChartLabels: string[] = [];
  public barChartOptions: ChartOptions= {
    responsive: false,
    scales: {
      x: {},
      y: {
        beginAtZero: true
      }
    }
  };
  public barChartPlugins = [];
  public barChartLegend = true;

  public lineChartData: ChartDataset[] = [{
    label: 'Всего изучено слов к этому дню',
    data: [],
    fill: true,
    tension: 0.5,
    borderColor: '#804399',
    backgroundColor: '#cfc0fb'
  }];
  public lineChartLabels: string[] = [];
  public lineChartOptions: ChartOptions = {
    responsive: false,
    scales: {
      x: {},
      y: {
        beginAtZero: true
      }
    }
  };
  public lineChartLegend = true;


  constructor(
    private statisticsService: StatisticsService,
    private storageService: StorageService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser()?.userId
    if (this.userId) {
      this.isLoading = true;
      this.statisticsService.getUserStatistics(this.userId).subscribe({
        next: (data: stringifiedNewBody) => {
          this.isLoading = false;
          this.statisticsData = {
            learnedWords: data.learnedWords,
            optional: {
              allStatisticsByDate: JSON.parse(data.optional.allStatisticsByDate),
            }
          };
          this.allTimeStatistics = structuredClone(this.statisticsData.optional.allStatisticsByDate.map((item) => {
            return {
              date: item.date,
              allWords: item.allWords,
              allNewWords: item.allNewWords
            };
          }));

          this.allTimeStatisticsDate = this.allTimeStatistics.map((item) => new Date(item.date).toLocaleDateString())
          this.barChartLabels = this.allTimeStatisticsDate;
          this.lineChartLabels = this.allTimeStatisticsDate;

          this.allTimeStatisticsAllWords = this.allTimeStatistics.map((item) => item.allWords)
          this.lineChartData[0].data = this.allTimeStatisticsAllWords;

          this.allTimeStatisticsAllNewWords = this.allTimeStatistics.map((item) => item.allNewWords)
          this.barChartData[0].data = this.allTimeStatisticsAllNewWords;

          if (
            isToday(new Date(
              this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].date
            ))
          ) {
            this.todayStatistics.allNewWords = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].allNewWords;
            this.todayStatistics.allWordsLearned = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].allWordsLearned;
            this.todayStatistics.allGamesRightPercent = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].allGamesRightPercent;
            this.todayStatisticsSprint.newWords = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.sprint.newWords;
            this.todayStatisticsSprint.rightPercent = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.sprint.rightPercent;
            this.todayStatisticsSprint.bestStreak = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.sprint.bestStreak;
            this.todayStatisticsAudioCall.newWords = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.audioCall.newWords;
            this.todayStatisticsAudioCall.rightPercent = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.audioCall.rightPercent;
            this.todayStatisticsAudioCall.bestStreak = this.statisticsData.optional.allStatisticsByDate[this.statisticsData.optional.allStatisticsByDate.length - 1].games.audioCall.bestStreak;
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = err.error;
          if (err.status === 404) {
            this.toastr.info('Статистика отсутствует, пожалуйста сыграйте в игру');
          } else {
            this.toastr.error(this.errorMessage);
          }
        }
      })
    }
  }
}
