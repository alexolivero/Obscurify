import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotifyAuthComponentComponent } from './spotify-auth-component.component';

describe('SpotifyAuthComponentComponent', () => {
  let component: SpotifyAuthComponentComponent;
  let fixture: ComponentFixture<SpotifyAuthComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotifyAuthComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotifyAuthComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
