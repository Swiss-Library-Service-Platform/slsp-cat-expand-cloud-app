/**
 * Component for managing templates.
 * Allows adding, removing, and displaying templates.
 */
import { Component, Input, OnInit } from '@angular/core';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { LoadingIndicatorService } from '../../services/loading-indicator.service';
import { StatusMessageService } from '../../services/status-message.service.ts';
import { TranslateService } from '@ngx-translate/core';
import { TemplateSetRegistry } from '../../templates_helper/template-set-registry.service';
import { TemplateSet } from '../../templates_helper/template-set';

@Component({
  selector: 'app-templates-management',
  templateUrl: './templates-management.component.html',
  styleUrls: ['./templates-management.component.scss']
})
export class TemplatesManagementComponent implements OnInit {

  /** Flag indicating if the user is allowed in IZ */
  @Input()
  isUserAllowedIZ: boolean;

  constructor(
    private templateSetRegistry: TemplateSetRegistry,
    private alert: AlertService,
    private loader: LoadingIndicatorService,
    private status: StatusMessageService,
    private translate: TranslateService,
  ) { }

  /**
   * Lifecycle hook that runs after component initialization.
   */
  ngOnInit(): void {
  }

  /**
   * Retrieves the template sets.
   * @returns Template sets
   */
  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get();
  }

  /**
   * Adds a new institution template.
   * @param newTemplate - The new template to add
   */
  async addInstitutionTemplate(newTemplate: any): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise();
    this.status.set(statusText);
    this.templateSetRegistry.storeInstitutionTemplate(newTemplate.value).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise();
        this.alert.info(alertText);
        newTemplate.value = null;
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      setTimeout(() => {
        this.loader.hide();
      }, 200);
    });
  }

  /**
   * Adds a new user template.
   * @param newTemplate - The new template to add
   */
  async addUserTemplate(newTemplate: any): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise();
    this.status.set(statusText);
    this.templateSetRegistry.storeUserTemplate(newTemplate.value).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise();
        this.alert.info(alertText);
        newTemplate.value = null;
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      setTimeout(() => {
        this.loader.hide();
      }, 200);
    });
  }

  /**
   * Removes an institution template.
   * @param event - The event that triggered the removal
   * @param templateName - The name of the template to remove
   */
  async removeInstitutionTemplate(event: Event, templateName: string): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise();
    this.status.set(statusText);
    event.stopPropagation();
    this.templateSetRegistry.removeInstitutionTemplate(templateName).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise();
        this.alert.info(alertText);
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      setTimeout(() => {
        this.loader.hide();
      }, 200);
    });
  }

  /**
   * Removes a user template.
   * @param event - The event that triggered the removal
   * @param templateName - The name of the template to remove
   */
  async removeUserTemplate(event: Event, templateName: string): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise();
    this.status.set(statusText);
    event.stopPropagation();
    this.templateSetRegistry.removeUserTemplate(templateName).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise();
        this.alert.info(alertText);
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      setTimeout(() => {
        this.loader.hide();
      }, 200);
    });
  }

}