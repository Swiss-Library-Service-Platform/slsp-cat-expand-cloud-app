import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcTableComponent } from './marc-table.component';

describe('MarcTableComponent', () => {
  let component: MarcTableComponent;
  let fixture: ComponentFixture<MarcTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarcTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarcTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
