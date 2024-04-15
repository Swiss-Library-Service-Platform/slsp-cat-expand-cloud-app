import { Component, OnInit, Input } from '@angular/core';
import { BibRecord } from '../../models/bib-record';
import { ChangeSet, ChangeType } from '../../templates/rules/rule';
import { ChangeTrackingService } from '../../services/change-tracking.service';

@Component({
  selector: 'app-marc-table',
  templateUrl: './marc-table.component.html',
  styleUrls: ['./marc-table.component.scss']
})
export class MarcTableComponent implements OnInit {

  @Input()
  xmlRecord: Document

  constructor(
    private changeTrackingService: ChangeTrackingService,
  ) { }

  ngOnInit(): void {
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
    const change: ChangeSet[] = this.changeTrackingService.getChanges().filter(change => change.changeHash === this.changeTrackingService.getNodeHash(field))
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

}
