import { Component, OnInit } from '@angular/core';
import { TemplateSetRegistry } from '../../templates/template-set-registry.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { LoadingIndicatorService } from '../../services/loading-indicator.service';
import { StatusMessageService } from '../../services/status-message.service.ts';
import { TemplateSet } from '../../templates/template-set';

@Component({
  selector: 'app-templates-management',
  templateUrl: './templates-management.component.html',
  styleUrls: ['./templates-management.component.scss']
})
export class TemplatesManagementComponent implements OnInit {

  constructor(
    private templateSetRegistry: TemplateSetRegistry,
    private alert: AlertService,
    private loader: LoadingIndicatorService,
    private status: StatusMessageService
  ) { }

  ngOnInit(): void {
  }

  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get()
  }

  addInstitutionTemplate(newTemplate: any): void {
    this.loader.show()
    this.status.set('Saving Template')
    this.templateSetRegistry.storeInstitutionTemplate(newTemplate.value).subscribe(result => {
      if (result.success) {
        this.alert.info(`Added new template`)
        newTemplate.value = null
      } else {
        this.alert.error(`Could not add template: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

  addUserTemplate(newTemplate: any): void {
    this.loader.show()
    this.status.set('Saving Template')
    this.templateSetRegistry.storeUserTemplate(newTemplate.value).subscribe(result => {
      if (result.success) {
        this.alert.info(`Added new template`)
        newTemplate.value = null
      } else {
        this.alert.error(`Could not add template: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

  removeInstitutionTemplate(event: Event, templateName: string): void {
    this.loader.show()
    this.status.set('Removing Template')
    event.stopPropagation()
    this.templateSetRegistry.removeInstitutionTemplate(templateName).subscribe(result => {
      if (result.success) {
        this.alert.info(`Removed template ${templateName}`)
      } else {
        this.alert.error(`Could not remove template ${templateName}: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

  removeUserTemplate(event: Event, templateName: string): void {
    this.loader.show()
    this.status.set('Removing Template')
    event.stopPropagation()
    this.templateSetRegistry.removeUserTemplate(templateName).subscribe(result => {
      if (result.success) {
        this.alert.info(`Removed template ${templateName}`)
      } else {
        this.alert.error(`Could not remove template ${templateName}: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

}
