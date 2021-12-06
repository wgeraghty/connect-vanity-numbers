import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VanityComponent } from './vanity.component';

describe('VanityComponent', () => {
  let component: VanityComponent;
  let fixture: ComponentFixture<VanityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VanityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VanityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
