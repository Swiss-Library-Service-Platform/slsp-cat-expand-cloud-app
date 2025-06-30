import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

/**
 * Represents information about an empty subfield in a MARC field.
 */
export interface EmptySubfield {
  ruleName: string;
  fieldTag: string;
  code: string;
  inputValue: string;
  description?: SubfieldDescription;
  customInputValue?: string;
  options?: string[];
}
/**
 * Represents the description of a subfield in different languages.
 */
export interface SubfieldDescription {
  de: string;
  en: string;
  fr: string;
  it: string;
}

/**
 * Represents the data structure passed to the empty subfields dialog.
 */
export interface DialogData {
  emptySubfields: EmptySubfield[];
}

@Component({
  selector: 'app-empty-subfields-dialog',
  templateUrl: './empty-subfields-dialog.component.html',
  styleUrls: ['./empty-subfields-dialog.component.scss']
})
/**
 * Dialog component for handling empty subfields in MARC fields.
 * Allows users to fill in values for empty subfields before applying a template.
 */
export class EmptySubfieldsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EmptySubfieldsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public sanitizer: DomSanitizer,
    private translateService: TranslateService
  ) { }

  /**
   * Handles the cancellation of the dialog.
   * Closes the dialog without returning any values.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Handles the apply action of the dialog.
   * Closes the dialog returning only the subfields that have values filled in.
   */
  onApplyClick(): void {
    // If the user selected custom value, use that as the inputValue
    this.data.emptySubfields.forEach(field => {
      if (field.inputValue === '__custom__' && field.customInputValue) {
        field.inputValue = field.customInputValue;
      }
    });
    // Return only fields that have values
    const filledSubfields = this.data.emptySubfields.filter(field => field.inputValue && field.inputValue.trim() !== '');
    this.dialogRef.close(filledSubfields);
  }

  /**
   * Gets the current language of the application.
   * This is used to determine which language to display for subfield descriptions.
   * @returns The current language code.
   */
  getCurrentLanguage(): string {
    const currentLang = this.translateService.currentLang;
    return currentLang ? currentLang : 'en'; // Default to 'en' if no language is set
  }

  /**
   * Handles click events on the custom input field to prevent event propagation.
   * @param event The mouse event that triggered the click.
   */
  onClickStopPropagation(event: MouseEvent): void {
    // Prevents the click event from propagating to parent elements
    event.stopPropagation();
  }

}
