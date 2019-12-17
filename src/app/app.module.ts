import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTreeModule } from '@angular/material';
import {JsonTreeEditorComponent} from './JsonTreeEditor/jsonTreeEditor.component';
import {AdvanceMappingWizComponent} from './AdvanceMapping/advancemappingwiz.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent, JsonTreeEditorComponent, AdvanceMappingWizComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTreeModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
