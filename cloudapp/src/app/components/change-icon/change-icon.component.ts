import { Component, Input } from '@angular/core'
import { ChangeType } from '../../templates/rules/rule'

@Component({
	selector: 'change-icon',
	templateUrl: './change-icon.component.html',
	styleUrls: ['./change-icon.component.scss']
})
export class ChangeIconComponent {

	@Input() changeType: ChangeType

}
