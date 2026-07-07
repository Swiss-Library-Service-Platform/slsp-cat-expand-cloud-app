/**
 * Component for managing templates.
 * Allows adding, removing, and displaying templates.
 * 
 * Note: In the past it was possible to add templates to different sets (templatesets).
 * if a template definition contained a "set" attribute.
 * This is now hidden in the UI, but the code still supports it, if it is needed in the future.
 */
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { LoadingIndicatorService } from '../../services/loading-indicator.service';
import { StatusMessageService } from '../../services/status-message.service.ts';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TemplateSetRegistry } from '../../templates_helper/template-set-registry.service';
import { TemplateSet } from '../../templates_helper/template-set';
import { LogService } from '../../services/log.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-templates-management',
  templateUrl: './templates-management.component.html',
  styleUrls: ['./templates-management.component.scss']
})
export class TemplatesManagementComponent implements OnInit, OnDestroy {

  /** Flag indicating if the user is allowed in IZ */
  @Input()
  isUserAllowedIZ: boolean;

  /** Template sets */
  templateSets: TemplateSet[];

  /** Name of the template currently being edited, null if not editing */
  editingTemplateName: string | null = null;

  /** Textarea content during edit mode */
  editSource: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private templateSetRegistry: TemplateSetRegistry,
    private alert: AlertService,
    private loader: LoadingIndicatorService,
    private status: StatusMessageService,
    private translate: TranslateService,
    private log: LogService,
    private dialog: MatDialog
  ) { }


  /**
   * Lifecycle hook that runs after component initialization.
   */
  ngOnInit(): void {
    this.templateSetRegistry.registry$.pipe(takeUntil(this.destroy$)).subscribe(templateSets => {
      this.log.debug('TemplatesManagementComponent: Received template sets', templateSets);
      this.log.debug('Count of template sets:', templateSets.length);
      this.templateSets = templateSets;
    });
  }

  /**
   * Adds a new institution template.
   * @param newTemplate - The new template to add
   */
  async addInstitutionTemplate(newTemplate: any): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise();
    this.status.set(statusText);
    this.templateSetRegistry.storeInstitutionTemplate(newTemplate.value).pipe(takeUntil(this.destroy$)).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise();
        this.alert.info(alertText);
        newTemplate.value = null;
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      this.loader.hide();
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
    this.templateSetRegistry.storeUserTemplate(newTemplate.value).pipe(takeUntil(this.destroy$)).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateAdded').toPromise();
        this.alert.info(alertText);
        newTemplate.value = null;
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateAddedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      this.loader.hide();
    });
  }

  /**
   * Removes an institution template after confirmation.
   * @param event - The event that triggered the removal
   * @param templateName - The name of the template to remove
   */
  async removeInstitutionTemplate(event: Event, templateName: string): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDelete();
    if (!confirmed) return;

    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise();
    this.status.set(statusText);
    this.templateSetRegistry.removeInstitutionTemplate(templateName).pipe(takeUntil(this.destroy$)).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise();
        this.alert.info(alertText);
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      this.loader.hide();
    });
  }

  /**
   * Removes a user template after confirmation.
   * @param event - The event that triggered the removal
   * @param templateName - The name of the template to remove
   */
  async removeUserTemplate(event: Event, templateName: string): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmDelete();
    if (!confirmed) return;

    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.removingTemplate').toPromise();
    this.status.set(statusText);
    this.templateSetRegistry.removeUserTemplate(templateName).pipe(takeUntil(this.destroy$)).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemoved').toPromise();
        this.alert.info(alertText);
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateRemovedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      this.loader.hide();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Shows a confirmation dialog before deleting a template.
   * @returns true if the user confirmed, false otherwise
   */
  private async confirmDelete(): Promise<boolean> {
    const message = await this.translate.get('templatesManagement.confirmDelete').toPromise();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message },
      width: '300px'
    });
    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Enters edit mode for a template.
   * @param template - The template to edit
   */
  startEdit(template: any): void {
    this.editingTemplateName = template.getName();
    this.editSource = template.getSource();
  }

  /**
   * Cancels edit mode.
   */
  cancelEdit(): void {
    this.editingTemplateName = null;
    this.editSource = '';
  }

  /**
   * Saves the edited template.
   * @param template - The template being edited
   */
  async saveEdit(template: any): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('templatesManagement.status.savingTemplate').toPromise();
    this.status.set(statusText);

    const oldName = template.getName();
    const origin = template.getOrigin();

    const update$ = origin === 'USER'
      ? this.templateSetRegistry.updateUserTemplate(oldName, this.editSource)
      : this.templateSetRegistry.updateInstitutionTemplate(oldName, this.editSource);

    update$.pipe(takeUntil(this.destroy$)).subscribe(async result => {
      if (result.success) {
        const alertText = await this.translate.get('templatesManagement.alert.templateUpdated').toPromise();
        this.alert.info(alertText);
        this.cancelEdit();
      } else {
        const alertText = await this.translate.get('templatesManagement.alert.templateUpdatedError').toPromise();
        this.alert.error(`${alertText}: ${result.error}`, { autoClose: true, delay: 5000 });
      }
      this.loader.hide();
    });
  }

}