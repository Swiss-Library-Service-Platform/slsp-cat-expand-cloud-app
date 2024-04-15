import { HttpClientModule } from '@angular/common/http'
import { Injector, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AlertModule, CloudAppTranslateModule, MaterialModule } from '@exlibris/exl-cloudapp-angular-lib'

import { AppInjector } from './app-injector'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { MainComponent } from './main/main.component'
import { AddDataFieldRuleCreator } from './templates/rules/add-data-field-rule'
import { ChangeControlFieldRuleCreator } from './templates/rules/change-control-field-rule'
import { RuleCreatorToken } from './templates/rules/rule-creator'
import { ChangeIconComponent } from './components/change-icon/change-icon.component';
import { MarcTableComponent } from './components/marc-table/marc-table.component'

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ChangeIconComponent,
    MarcTableComponent
  ],
  imports: [
    MaterialModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    AlertModule,
    FormsModule,
    ReactiveFormsModule,
    CloudAppTranslateModule.forRoot(),
  ],
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'standard' } },
    { provide: RuleCreatorToken, useClass: AddDataFieldRuleCreator, multi: true },
    { provide: RuleCreatorToken, useClass: ChangeControlFieldRuleCreator, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(
    private injector: Injector
  ) {
    AppInjector.setInjector(injector)
  }
}
