
/**
 * Component for the main functionality of the application.
 * Handles record loading, applying templates, saving records, and managing changes.
 */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertService, CloudAppEventsService, CloudAppRestService, Entity, EntityType, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib';
import { Observable, of } from 'rxjs';
import { catchError, filter, shareReplay, switchMap, tap } from 'rxjs/operators';
import { BibRecord } from '../models/bib-record';
import { ChangeTrackingService } from '../services/change-tracking.service';
import { LoadingIndicatorService } from '../services/loading-indicator.service';
import { LogService } from '../services/log.service';
import { NetworkZoneRestService } from '../services/network-zone-rest.service';
import { StatusMessageService } from '../services/status-message.service.ts';
import { XPathHelperService } from '../services/xpath-helper.service';
import { ChangeSet, ChangeType } from '../templates_helper/rules/rule';
import { Template } from '../templates_helper/template';
import { TemplateSet } from '../templates_helper/template-set';
import { TemplateSetRegistry } from '../templates_helper/template-set-registry.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  /** List of entities */
  entities: Entity[];
  /** Currently selected entity */
  selectedEntity: BibRecord;
  /** XML content of the selected record */
  xml: string;
  /** String representation of XML content */
  xmlString: string;
  /** Flag indicating if there are changes */
  hasChanges: boolean;
  /** List of changes */
  changes: ChangeSet[];
  /** Flag indicating if authorization is done */
  isAuthorizationDone: boolean;
  /** Flag indicating if user is allowed in IZ */
  isUserAllowedIZ: boolean;
  /** Flag indicating if institution is allowed */
  isInstitutionAllowed: boolean = false;
  /** Flag indicating if the environment is production */
  isProdEnvironment: boolean;

  /** Observable of entities filtered for BIB_MMS type */
  entities$: Observable<Entity[]> = this.eventsService.entities$
    .pipe(
      filter(entities => entities.every(entity => entity.type === EntityType.BIB_MMS))
    );

  constructor(
    private log: LogService,
    private restService: CloudAppRestService,
    private networkZoneRestService: NetworkZoneRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService,
    private templateSetRegistry: TemplateSetRegistry,
    private changeTrackingService: ChangeTrackingService,
    private translate: TranslateService,
    private _status: StatusMessageService,
    private _loader: LoadingIndicatorService,
  ) { }

  /**
   * Getter for LoadingIndicatorService instance.
   * @returns LoadingIndicatorService instance
   */
  get loader(): LoadingIndicatorService {
    return this._loader;
  }

  /**
   * Getter for StatusMessageService instance.
   * @returns StatusMessageService instance
   */
  get status(): StatusMessageService {
    return this._status;
  }

  /**
   * Lifecycle hook that runs after component initialization.
   * Loads initial data and sets up environment.
   */
  async ngOnInit(): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('main.status.loading').toPromise();
    this.status.set(statusText);
    this.hasChanges = false;

    this.eventsService.getInitData()
      .subscribe(initData => {

        // Setting isProd environment
        this.isProdEnvironment = this.networkZoneRestService.setIsProdEnvironment(initData);
        this.log.info('isProd', this.isProdEnvironment);

        // Institution Authorization
        this.log.info('Checking if current institution is allowed to use this app');
        this.networkZoneRestService.getIsCurrentInstitutionAllowed(initData.instCode).subscribe(
          allowed => {
            this.isInstitutionAllowed = true;
            // User Authorization
            this.isUserAllowedIZ = initData.user.isAdmin;
            this.isAuthorizationDone = true;

            // Get Entities
            this.entities$
              .subscribe(
                (entities) => {
                  this.entities = entities;
                  this.loader.hide();
                },
                (error) => {
                  this.log.error('entities load failed:', error);
                  this.loader.hide();
                });
          },
          error => {
            this.log.error('Error checking if current institution is allowed to use this app', error);
            this.loader.hide();
            this.isAuthorizationDone = true;
          });
      });
  }

  /**
   * Lifecycle hook that runs when component is destroyed.
   */
  ngOnDestroy(): void {
  }

  /**
   * Loads the record corresponding to the given entity.
   * @param entity - The entity for which to load the record
   */
  async loadRecord(entity: Entity): Promise<void> {
    this.hasChanges = false;
    this.log.info(entity);
    this.loader.show();
    const statusText = await this.translate.get('main.status.selectingRecord').toPromise();
    this.status.set(statusText);
    this.getBibRecord(entity)
      .subscribe(
        (bibRecord: BibRecord) => {
          this.log.info('selectRecord successful:', bibRecord);
          this.selectRecord(bibRecord);
          this.log.info('selected', this.selectedEntity);
          this.loader.hide();
        },
        async (error) => {
          this.log.error('selectRecord failed:', error);
          const alertText = await this.translate.get('main.alert.recordLoadError').toPromise();
          this.alert.error(`${alertText}: ${error.statusText}`, { autoClose: true, delay: 5000 });
          this.loader.hide();
        }
      );
  }

  /**
   * Selects the given record.
   * @param entity - The record to select
   */
  selectRecord(entity: BibRecord): void {
    this.selectedEntity = entity;
    this.selectedEntity['appliedTemplates'] = [];
    this.xmlString = this.selectedEntity.anies[0];
  }

  /**
   * Navigates back to the list of records.
   */
  navigateBack(): void {
    this.selectedEntity = null;
    this.xmlString = null;
  }

  /**
   * Resets the changes made to the current record.
   */
  resetChanges(): void {
    this.hasChanges = false;
    this.changeTrackingService.removeAllChanges();
    this.xmlString = this.selectedEntity.anies[0];
    this.selectedEntity['appliedTemplates'] = [];
  }

  /**
   * Retrieves the template sets.
   * @returns Template sets
   */
  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get();
  }

  /**
   * Applies the given template to the selected record.
   * @param event - The event that triggered the template application
   * @param template - The template to apply
   */
  async applyTemplate(event: Event, template: Template): Promise<void> {
    event.stopPropagation();
    this.loader.show();
    const statusText = await this.translate.get('main.status.applyingTemplate').toPromise();
    this.status.set(statusText);
    this.log.info('apply template:', template.getName());
    let changes = [];
    [this.xmlString, changes] = template.applyTemplate(this.xmlString);
    this.selectedEntity['appliedTemplates'][template.getName()] = true;
    this.changeTrackingService.addChanges(changes);
    this.hasChanges = true;
    this.loader.hide();
  }

  /**
   * Saves the changes made to the selected record.
   */
  async saveRecord(): Promise<void> {
    this.loader.show();
    const statusText = await this.translate.get('main.status.savingRecord').toPromise();
    this.status.set(statusText);
    const nzMmsId: Observable<string> = this.getNzMmsIdFromEntity(this.selectedEntity.entity);

    this.log.info('selected entity', this.selectedEntity);

    nzMmsId.subscribe(id => {
      this.networkZoneRestService.call({
        method: HttpMethod.PUT,
        url: `/bibs/${id}`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/xml'
        },
        requestBody: `<bib>${this.xmlString}</bib>`
      }).subscribe(
        (bibRecord: BibRecord) => {
          this.log.info('save successful:', bibRecord);
          this.eventsService.refreshPage().subscribe(async pageReloaded => {
            this.selectRecord(bibRecord);
            const alertText = await this.translate.get('main.alert.recordSaved').toPromise();
            this.alert.success(alertText);
          });
          this.resetChanges();
          this.loader.hide();
        },
        async (error) => {
          this.log.error('save failed:', error);
          const alertText = await this.translate.get('main.alert.recordSavedError').toPromise();
          this.alert.error(`${alertText}: ${error.statusText}`, { autoClose: true, delay: 5000 });
          this.loader.hide();
        }
      );
    });
  }

  /**
   * Retrieves the BibRecord corresponding to the given entity.
   * @param entity - The entity for which to retrieve the BibRecord
   * @returns Observable of BibRecord
   */
  private getBibRecord(entity: Entity): Observable<BibRecord> {
    return this.getNzMmsIdFromEntity(entity)
      .pipe(
        switchMap(id => {
          this.log.info('getBibRecord', id);
          return this.networkZoneRestService.call(
            {
              method: HttpMethod.GET,
              url: `/bibs/${id}`
            })
        }),
        switchMap(response => {
          if (response.bib) {
            const bibRecord: BibRecord = response.bib[0];
            bibRecord.entity = entity;
            return of(bibRecord);
          } else {
            const bibRecord: BibRecord = response;
            bibRecord.entity = entity;
            return of(response);
          }
        })
      );
  }

  /**
   * Retrieves the NZ MMS ID from the given entity.
   * @param entity - The entity for which to retrieve the NZ MMS ID
   * @returns Observable of NZ MMS ID
   */
  private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
    const id = entity.id;
    if (entity.link.indexOf("?nz_mms_id") >= 0) {
      return of(id);
    }
    return this.restService.call({
      method: HttpMethod.GET,
      url: entity.link,
      queryParams: { view: 'brief' }
    })
      .pipe(
        switchMap(response => {
          const nzMmsId: string = response?.linked_record_id?.value;
          if (!nzMmsId) {
            throw new Error('No NZ MMSID found in linked record');
          }
          return of(nzMmsId);
        }),
        catchError(error => {
          this.log.error('Error retrieving NZ MSSID. Trying with entity ID.', error);
          return of(entity.id);
        }),
        shareReplay(1)
      );
  }

}
