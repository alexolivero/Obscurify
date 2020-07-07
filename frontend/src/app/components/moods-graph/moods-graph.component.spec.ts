import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoodsGraphComponent } from './moods-graph.component';

describe('MoodsGraphComponent', () => {
  let component: MoodsGraphComponent;
  let fixture: ComponentFixture<MoodsGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoodsGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
