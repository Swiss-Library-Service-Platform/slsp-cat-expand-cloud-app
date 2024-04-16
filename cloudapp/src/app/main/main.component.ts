import { Component, OnDestroy, OnInit } from '@angular/core'
import { AlertService, CloudAppEventsService, CloudAppRestService, Entity, EntityType, HttpMethod } from '@exlibris/exl-cloudapp-angular-lib'
import { Observable, of } from 'rxjs'
import { catchError, filter, shareReplay, switchMap, tap } from 'rxjs/operators'
import { BibRecord } from '../models/bib-record'
import { ChangeTrackingService } from '../services/change-tracking.service'
import { LoadingIndicatorService } from '../services/loading-indicator.service'
import { LogService } from '../services/log.service'
import { NetworkZoneRestService } from '../services/network-zone-rest.service'
import { StatusMessageService } from '../services/status-message.service.ts'
import { XPathHelperService } from '../services/xpath-helper.service'
import { ChangeSet, ChangeType } from '../templates/rules/rule'
import { Template } from '../templates/template'
import { TemplateSet } from '../templates/template-set'
import { TemplateSetRegistry } from '../templates/template-set-registry.service'

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  entities: Entity[]
  selectedEntity: BibRecord
  xml: string
  xmlString: string
  hasChanges: boolean
  changes: ChangeSet[]
  isAuthorizationDone: boolean
  isUserAdmin: boolean
  isInstitutionAllowed: boolean = false
  isProdEnvironment: boolean

  entities$: Observable<Entity[]> = this.eventsService.entities$
    .pipe(
      filter(entites => entites.every(entity => entity.type === EntityType.BIB_MMS))
    )

  constructor(
    private log: LogService,
    private restService: CloudAppRestService,
    private networkZoneRestService: NetworkZoneRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService,
    private templateSetRegistry: TemplateSetRegistry,
    private changeTrackingService: ChangeTrackingService,
    private xpath: XPathHelperService,
    private _status: StatusMessageService,
    private _loader: LoadingIndicatorService,
  ) { }

  get loader(): LoadingIndicatorService {
    return this._loader
  }

  get status(): StatusMessageService {
    return this._status
  }

  ngOnInit(): void {
    this.loader.show()
    this.status.set("Loading")
    this.hasChanges = false

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
            this.isUserAdmin = initData.user.isAdmin;
            this.isAuthorizationDone = true;

            // Get Entities
            this.entities$
              .subscribe(
                (entites) => {
                  this.entities = entites
                  this.loader.hide();
                },
                (error) => {
                  this.log.error('ngOnInit failed:', error)
                  this.loader.hide()
                });
          },
          error => {
            this.log.error('Error checking if current institution is allowed to use this app', error)
            this.loader.hide()
            this.isAuthorizationDone = true;
          });
      });
  }

  ngOnDestroy(): void {
  }

  loadRecord(entity: Entity): void {
    this.hasChanges = false
    this.log.info(entity)
    this.loader.show()
    this.status.set('Selecting Record')
    this.getBibRecord(entity)
      .subscribe(
        (bibRecord: BibRecord) => {
          this.log.info('selectRecord successful:', bibRecord)
          this.selectRecord(bibRecord)
          this.log.info('selected', this.selectedEntity)
          this.loader.hide()
        },
        (error) => {
          this.log.error('selectRecord failed:', error)
          this.alert.error('Could not select record');
          this.loader.hide()
        }
      )
  }

  selectRecord(entity: BibRecord): void {
    this.selectedEntity = entity;
    this.selectedEntity['appliedTemplates'] = []
    this.xmlString = this.selectedEntity.anies[0]
  }


  navigateBack(): void {
    this.selectedEntity = null
    this.xmlString = null
  }

  resetChanges(): void {
    this.hasChanges = false
    this.changeTrackingService.removeAllChanges();
    this.xmlString = this.selectedEntity.anies[0]
    this.selectedEntity['appliedTemplates'] = []
  }

  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get()
  }

  applyTemplate(event: Event, template: Template): void {
    event.stopPropagation()
    this.loader.show()
    this.status.set('Applying Template')
    this.log.info('apply template:', template.getName())
    let changes = [];
    [this.xmlString, changes] = template.applyTemplate(this.xmlString)
    this.selectedEntity['appliedTemplates'][template.getName()] = true;
    this.changeTrackingService.addChanges(changes);
    this.hasChanges = true
    this.loader.hide()
  }

  saveRecord(): void {
    this.loader.show()
    this.status.set('Saving Record')
    const nzMmsId: Observable<string> = this.getNzMmsIdFromEntity(this.selectedEntity.entity)

    this.log.info('selected entity', this.selectedEntity)

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
          this.log.info('save successful:', bibRecord)
          this.eventsService.refreshPage().subscribe(pageReloaded => {
            this.selectRecord(bibRecord)
            this.alert.success(`Record saved`)
          });
          this.resetChanges()
          this.loader.hide()
        },
        (error) => {
          this.log.error('save failed:', error)
          this.eventsService.refreshPage().subscribe()
          this.loader.hide()
        }
      )
    })
  }

  

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
            const bibRecord: BibRecord = response.bib[0]
            bibRecord.entity = entity
            return of(bibRecord)
          } else {
            const bibRecord: BibRecord = response
            bibRecord.entity = entity
            return of(response)
          }
        })
      )
  }

  private getNzMmsIdFromEntity(entity: Entity): Observable<string> {
    const id = entity.id
    if (entity.link.indexOf("?nz_mms_id") >= 0) {
      return of(id)
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
            throw new Error('No NZ MMSID found in linked record')
          }
          return of(nzMmsId)
        }),
        catchError(error => {
          this.log.error('Error retrieving NZ MSSID. Trying with entity ID.', error)
          return of(entity.id)
        }),
        shareReplay(1)
      )
  }

}
