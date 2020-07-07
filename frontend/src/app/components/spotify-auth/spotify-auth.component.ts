import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService, TokenService } from 'src/app/services/spotifyAuth';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-spotify-auth',
  template: `<h3>Authorizing&hellip;</h3>`,
  styles: [``]
})
export class SpotifyAuthComponent implements AfterViewInit {

  public constructor(private authService: AuthService, private cookieService: CookieService, private tknService: TokenService) {

  }

  public ngAfterViewInit() {
    this.authService.authorized();
  }
}
