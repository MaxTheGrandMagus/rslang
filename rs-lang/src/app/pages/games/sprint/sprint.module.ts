import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintRoutingModule } from './sprint-routing.module';
import { SprintComponent } from './sprint.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DifficultyForm, DifficultyFormComponent } from './difficulty-form/difficulty-form.component';

@NgModule({
  declarations: [
    DifficultyFormComponent,
    DifficultyForm,
    SprintComponent
    
  ],
  imports: [
    CommonModule,
    SprintRoutingModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class SprintModule { }
