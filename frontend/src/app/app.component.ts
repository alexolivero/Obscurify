import { Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';
import { Component, OnInit } from '@angular/core';
import { TokenService, AuthService } from './services/spotifyAuth';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'obscurify3';

  constructor(@Inject(PLATFORM_ID) private platformId: any, @Inject(DOCUMENT) private document: any,
    private tokenSvc: TokenService,
    private authService: AuthService,
    private router: Router,
    public snackBar: MatSnackBar

  ) {}

  ngOnInit(): void {
    this.authService.authorizedStream.subscribe((x: boolean) => {
      if (x) {
        this.router.navigate(['home']);
      }
    });
    if (!isPlatformBrowser(this.platformId)) {
      const bases = this.document.getElementsByTagName('base');

      if (bases.length > 0) {
        bases[0].setAttribute('href', environment.baseHref);
      }
    }
  }

  public getUserInfo(): void {
  }

  public logout(): void {
    this.tokenSvc.clearToken();
    this.router.navigate(['login']);
  }
}
