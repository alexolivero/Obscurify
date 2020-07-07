import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { tap } from 'rxjs/operators';

@Injectable()
export abstract class SpotifyAuthInterceptor implements HttpInterceptor {
  constructor(private tokenSvc: TokenService) {}

  abstract doOnError(err: any): void;

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authReq = req.clone({ setHeaders: this.tokenSvc.authHeader });
    return next.handle(authReq).pipe(tap(
        (event: HttpEvent<any>) => {},
        this.doOnError
      )
    );
  }
}
