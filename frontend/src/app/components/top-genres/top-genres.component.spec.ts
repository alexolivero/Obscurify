import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopGenresComponent } from './top-genres.component';

describe('TopGenresComponent', () => {
  let component: TopGenresComponent;
  let fixture: ComponentFixture<TopGenresComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopGenresComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopGenresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
