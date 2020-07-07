import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistNavComponent } from './artist-nav.component';

describe('ArtistNavComponent', () => {
  let component: ArtistNavComponent;
  let fixture: ComponentFixture<ArtistNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArtistNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtistNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
