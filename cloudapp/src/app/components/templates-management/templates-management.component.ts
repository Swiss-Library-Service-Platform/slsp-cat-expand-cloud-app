import { Component, OnInit } from '@angular/core';
import { TemplateSetRegistry } from '../../templates/template-set-registry.service';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { LoadingIndicatorService } from '../../services/loading-indicator.service';
import { StatusMessageService } from '../../services/status-message.service.ts';
import { TemplateSet } from '../../templates/template-set';
import { TranslateService } from '@ngx-translate/core';

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
    private status: StatusMessageService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get()
  }

  async addInstitutionTemplate(newTemplate: any): Promise<void> {
    this.loader.show()
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise()
    this.status.set(statusText)
    this.templateSetRegistry.storeInstitutionTemplate(newTemplate.value).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise()
        this.alert.info(alertText)
        newTemplate.value = null
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise()
        this.alert.error(`${alertText}: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

  async addUserTemplate(newTemplate: any): Promise<void> {
    this.loader.show()
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise()
    this.status.set(statusText)
    this.templateSetRegistry.storeUserTemplate(newTemplate.value).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise()
        this.alert.info(alertText)
        newTemplate.value = null
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise()
        this.alert.error(`${alertText}: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

  async removeInstitutionTemplate(event: Event, templateName: string): Promise<void> {
    this.loader.show()
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise()
    this.status.set(statusText)
    event.stopPropagation()
    this.templateSetRegistry.removeInstitutionTemplate(templateName).subscribe(async result => {
      if (result.success) {
        if (result.success) {
          const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise()
          this.alert.info(alertText)
        } else {
          const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise()
          this.alert.error(`${alertText}: ${result.error}`)
        }
        setTimeout(() => {
          this.loader.hide()
        }, 200)
      }
    })
  }

  async removeUserTemplate(event: Event, templateName: string): Promise<void> {
    this.loader.show()
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise()
    this.status.set(statusText)
    event.stopPropagation()
    this.templateSetRegistry.removeUserTemplate(templateName).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise()
        this.alert.info(alertText)
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise()
        this.alert.error(`${alertText}: ${result.error}`)
      }
      setTimeout(() => {
        this.loader.hide()
      }, 200)
    })
  }

}
