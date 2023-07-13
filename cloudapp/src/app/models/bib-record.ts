import { Entity } from '@exlibris/exl-cloudapp-angular-lib'

export interface BibRecord {
	mms_id: string
	title: string
	author: string
	record_format: string
	anies: string[]
	entity: Entity
}

