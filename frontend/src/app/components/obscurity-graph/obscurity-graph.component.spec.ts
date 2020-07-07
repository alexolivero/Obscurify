import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObscurityGraphComponent } from './obscurity-graph.component';

describe('ObscurityGraphComponent', () => {
  let component: ObscurityGraphComponent;
  let fixture: ComponentFixture<ObscurityGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObscurityGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObscurityGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
