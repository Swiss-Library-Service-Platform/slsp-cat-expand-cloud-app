import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable({
	providedIn: 'root'
})
export class LoadingIndicatorService {
	isLoading = new Subject<boolean>()
	progress = new Subject<number>()
	mode = new Subject<string>()

	show(): void {
		this.isLoading.next(true)
	}

	hide(): void {
		this.isLoading.next(false)
	}

	hasProgress(hasProgress: boolean): void {
		hasProgress ? this.mode.next('determinate') : this.mode.next('indeterminate')
	}

	setProgress(currentProgress: number): void {
		this.progress.next(currentProgress)
	}
}
