import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SpotifyAuthResponse } from '../shared/spotify-auth-response.i';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private tokenSvc: TokenService) { }

  public canActivate(
    next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivateChild(next, state);
  }

  public canActivateChild(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const response = next.queryParams;
    if (response.spotifyToken && response.obscurifyToken) {
      this.tokenSvc.setAuthToken(response);
    }
    return !!response;
  }
}
