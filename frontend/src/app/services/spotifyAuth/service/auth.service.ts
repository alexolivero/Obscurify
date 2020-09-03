import { Injectable, PLATFORM_ID, Inject } from '@angular/core';

import { AuthConfig } from '../shared/spotify-auth-config.i';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';


@Injectable()
export class AuthService {

  constructor(@Inject(PLATFORM_ID) private platformId) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  private isBrowser: boolean;
  private requestAuthUrl = 'https://accounts.spotify.com/authorize';
  private authorized$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private state = this.generateRandomString();

  private authConfig: AuthConfig = {
    client_id: environment.client_id,  // WebPortal App Id. Shoud be config
    response_type: 'code',
    redirect_uri: environment.redirect_uri, // My URL
    state: this.state,
    show_dialog: false,
    scope: 'user-read-private user-top-read playlist-modify-public playlist-modify-private'

  };

  private generateRandomString() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  public authorize() {
    if (this.isBrowser) {
      window.location.href = this.buildAuthUrl();
    }
  }

  // Signal someone, that router can navigate somewhere
  public authorized(): void {
    this.authorized$.next(true);
  }

  public get authorizedStream(): Observable<boolean> {
    return this.authorized$.asObservable();
  }

  public configure(config: AuthConfig): AuthService {
    // Validate Config
    this.authConfig = config;
    return this;
  }

  private buildAuthUrl(): string {

    const params = [];
    for (const [key, value] of Object.entries(this.authConfig)) {
      if (typeof (value) === 'object') {
        params.push(`${key}=${(value as string[]).join(' ')}`);
      } else {
        params.push(`${key}=${value}`);
      }
    }

    return `${this.requestAuthUrl}?${params.join('&')}`;
  }
}
