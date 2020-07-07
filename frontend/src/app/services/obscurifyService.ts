import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class ObscurifyService {
    constructor(public http: HttpClient) {
        this.obscurifyData$ = new BehaviorSubject<{}>(this.obscurifyData);
    }

    private obscurifyData = {};
    private obscurifyData$: BehaviorSubject<{}>;

    public obscurifyUrl = environment.obscurifyApiUrl;

    getObscurifyData(countryID, obscurifyScore, recentObscurifyScore): Observable<{}> {
        return this.http.get(this.obscurifyUrl +
            `/getObscurifyData?code=${countryID}&obscurifyScore=${obscurifyScore}&recentObscurifyScore=${recentObscurifyScore}`)
            .pipe(
            tap((data: any) => {
              data.averageScore = Math.round(data.averageScore);
              data.globalAverageScore = Math.round(data.globalAverageScore);
              this.obscurifyData = {...data};
              this.obscurifyData$.next(this.obscurifyData);
            }),
            catchError(this.handleError('Error')
            )
          );
    }

    getUserHistory(config): Observable<{}> {
      return this.http.get(this.obscurifyUrl + `/getUserHistory?userID=${config.userID}&hex=${config.hex}`);
    }

    saveUserHistory(config): Observable<{}> {
      return this.http.post(this.obscurifyUrl + '/saveUserHistory', config);
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
          (result as any) = error;
          return of(result as T);
        };
      }

}

export default ObscurifyService;
