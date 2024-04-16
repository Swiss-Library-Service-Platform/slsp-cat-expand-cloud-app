import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesManagementComponent } from './templates-management.component';

describe('TemplatesManagementComponent', () => {
  let component: TemplatesManagementComponent;
  let fixture: ComponentFixture<TemplatesManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplatesManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
