import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions" align="end">
        <button mat-flat-button color="secondary" (click)="dialogRef.close(false)">
          {{ 'dialog.confirm.cancel' | translate }}
        </button>
        <button mat-flat-button class="mat-small" color="primary" (click)="dialogRef.close(true)">
          {{ 'dialog.confirm.delete' | translate }}
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-content {
      padding: 0;
    }
    .dialog-message {
      padding: 24px;
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .dialog-actions {
      border-top: 1px solid rgba(0, 0, 0, 0.12);
      padding: 12px;
      display: flex;
      justify-content: space-between;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) { }
}
