import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Represents information about an empty subfield in a MARC field.
 */
export interface EmptySubfield {
  fieldTag: string;
  fieldName: string;
  code: string;
  description?: string;
  inputValue: string;
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
    public sanitizer: DomSanitizer
  ) {}

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
    // Return only fields that have values
    const filledSubfields = this.data.emptySubfields.filter(field => field.inputValue.trim() !== '');
    this.dialogRef.close(filledSubfields);
  }

}
