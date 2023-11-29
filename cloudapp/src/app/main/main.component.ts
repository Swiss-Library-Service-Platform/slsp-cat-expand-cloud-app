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
  xmlRecord: Document
  hasChanges: boolean
  changes: ChangeSet[]
  userIsAdmin: boolean

  entities$: Observable<Entity[]> = this.eventsService.entities$
    .pipe(
      tap(() => this.reset()),
      filter(entites => entites.every(entity => entity.type === EntityType.BIB_MMS))
    )

  constructor(
    private log: LogService,
    private restService: CloudAppRestService,
    private networkZoneRestService: NetworkZoneRestService,
    private eventsService: CloudAppEventsService,
    private alert: AlertService,
    private templateSetRegistry: TemplateSetRegistry,
    private xpath: XPathHelperService,
    private changeTrackingService: ChangeTrackingService,
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
    this.status.set("loading")
    this.hasChanges = false
    this.changes = []

    this.entities$
      .subscribe(
        (entites) => {
          this.entities = entites
          console.log(entites)
        },
        (error) => {
          this.log.error('ngOnInit failed:', error)
          this.loader.hide()
        })

    this.eventsService.getInitData()
      .subscribe(data => this.userIsAdmin = data.user.isAdmin)
  }

  ngOnDestroy(): void {
  }

  selectRecord(entity: Entity): void {
    this.hasChanges = false
    this.log.info(entity)
    this.loader.show()
    this.status.set('selecting record')
    this.getBibRecord(entity)
      .subscribe(
        (bibRecord) => {
          this.log.info('selectRecord successful:', bibRecord)
          this.selectedEntity = bibRecord
          this.log.info('selected', this.selectedEntity)
          this.xmlRecord = new DOMParser().parseFromString(this.selectedEntity.anies[0], "application/xml")
          this.loader.hide()
        },
        (error) => {
          this.log.error('selectRecord failed:', error)
          this.loader.hide()
        }
      )
  }

  getMarc(): {}[] {
    return this.createMarc()
  }

  //TODO: rewrite and extract
  private createMarc(): {}[] {
    const record: Element = this.xmlRecord.getElementsByTagName("record")[0]
    const fields: Node[] = Array.from(record.childNodes)

    return fields.map((field: Element) => {
      const entry: {} = {}
      if (field.tagName == 'leader') {
        entry['change'] = ChangeType.None
        entry['tag'] = 'LDR'
        entry['ind1'] = ' '
        entry['ind2'] = ' '
        const valueMap: { code: string, value: string }[] = []
        valueMap.push({ code: '', value: field.textContent.replace(/ /g, '#') })
        entry['value'] = valueMap
        return entry
      }
      const tag: string = field.getAttribute('tag')
      entry['change'] = this.getChange(field)
      if (field.tagName == 'controlfield') {
        entry['tag'] = tag
        entry['ind1'] = ' '
        entry['ind2'] = ' '
        const valueMap: { [code: string]: string }[] = []
        valueMap.push({ code: '', value: field.textContent.replace(/ /g, '#') })
        entry['value'] = valueMap
        return entry
      }
      if (field.tagName == 'datafield') {
        entry['tag'] = tag
        entry['ind1'] = field.getAttribute('ind1')
        entry['ind2'] = field.getAttribute('ind2')
        const valueMap: { [code: string]: string }[] = []
        Array.from(field.childNodes).forEach((subfield: Element) => {
          const key: string = subfield.getAttribute("code")
          const value: string = subfield.textContent
          valueMap.push({ code: key, value: value })
        })
        entry['value'] = valueMap
      }
      return entry
    })
  }

  getChange(field: Element): ChangeType {
    const change: ChangeSet[] = this.changes.filter(change => change.changeHash === this.changeTrackingService.getNodeHash(field))
    if (change != undefined && change.length > 0) {
      return change.reduce((previous, current) => {
        if (current.type == ChangeType.Create) {
          return ChangeType.Create
        }
        return previous
      }, ChangeType.Change)
    }
    return ChangeType.None
  }

  reset(): void {
    this.selectedEntity = null
    this.hasChanges = false
    this.changes = []
  }

  getTemplateSets(): TemplateSet[] {
    return this.templateSetRegistry.get()
  }

  applyTemplate(event: Event, template: Template): void {
    event.stopPropagation()
    this.loader.show()
    this.status.set('applying template')
    this.log.info('apply template:', template.getName())
    const changes = template.applyTemplate(this.xmlRecord)
    this.changes.push(...changes)
    this.hasChanges = true
    this.loader.hide()
  }

  save(): void {
    this.loader.show()
    this.status.set('saving record')
    const nzMmsId: Observable<string> = this.getNzMmsIdFromEntity(this.selectedEntity.entity)//this.selectedEntity.mms_id
    const record: Node = this.xpath.querySingle('//record', this.xmlRecord)
    const recordXml: string = new XMLSerializer().serializeToString(record)

    this.log.info('selected entity', this.selectedEntity)

    nzMmsId.subscribe(id => {
      this.networkZoneRestService.call({
        method: HttpMethod.PUT,
        url: `/bibs/${id}`,
        //queryParams: params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/xml'
        },
        requestBody: `<bib>${recordXml}</bib>`
      }).subscribe(
        (response) => {
          this.log.info('save successful:', response)
          this.eventsService.refreshPage().subscribe()
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

  addInstitutionTemplate(newTemplate: any): void {
    this.loader.show()
    this.status.set('saving template')
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
    this.status.set('saving template')
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
    this.status.set('removing template')
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
    this.status.set('removing template')
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

  private getBibRecord(entity: Entity): Observable<BibRecord> {
    return this.getNzMmsIdFromEntity(entity)
      .pipe(
        switchMap(id => {
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
          const nzMmsId: string = response?.linked_record_id?.value
          this.log.info('nzMmsId', nzMmsId)
          return of(nzMmsId)
        }),
        catchError(error => {
          this.log.error('Cannot get NZ MMSID from API. Assuming the MMSID is already from NZ.', error)
          return of(entity.id)
        }),
        shareReplay(1)
      )
  }
}
