import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TextbookRoutingModule } from './textbook-routing.module';
import { TextbookComponent } from './textbook.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { WordCardComponent } from './components/word-card/word-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@NgModule({
  declarations: [
    TextbookComponent,
    CategoriesComponent,
    WordCardComponent
  ],
  imports: [
    CommonModule,
    TextbookRoutingModule,
    MatButtonModule,
    MatCardModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatIconModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatTableModule,
    MatProgressSpinnerModule
  ]
})
export class TextbookModule { }
