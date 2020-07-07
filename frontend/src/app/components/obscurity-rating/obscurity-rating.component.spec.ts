import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObscurityRatingComponent } from './obscurity-rating.component';

describe('ObscurityRatingComponent', () => {
  let component: ObscurityRatingComponent;
  let fixture: ComponentFixture<ObscurityRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObscurityRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObscurityRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
