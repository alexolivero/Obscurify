import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class InfoService {

  private apiUserUrl = 'https://api.spotify.com/v1/me';
  private apiAllTimeArtists = 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term';
  private apiCurrentArtists = 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term';
  private apiAllTimeTracks = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term';
  private apiCurrentTracks = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term';


  constructor(
    private http: HttpClient) {
  }

  public fetchUserInfo(): Observable<{}> {
    return this.http.get(this.apiUserUrl).pipe(
      (user) => {
        return user;
      },
      catchError(this.handleError('getSelf'))
    );
  }

  public fetchAllTimeTracks(): Observable<{}> {
    return this.http.get(this.apiAllTimeTracks).pipe(
      map((tracks: {items: [{id: string, popularity: number}]}) => {

        const allTimeTrackIDs = [];

        for (const track of tracks.items) {
          allTimeTrackIDs.push(track.id);
        }

        return {
          allTimeTracks: tracks.items,
          allTimeTrackIDs: [...allTimeTrackIDs]
        };
      }),
      catchError(this.handleError('getSelfAlbums'))
    );
  }

  public fetchCurrentTracks(): Observable<{}> {
    return this.http.get(this.apiCurrentTracks).pipe(
      map((tracks: {items: [{id: string, popularity: number}]}) => {
        const currentTrackIDs = [];

        for (const track of tracks.items) {
          currentTrackIDs.push(track.id);
        }

        return {
          currentTracks: tracks.items,
          currentTrackIDs: [...currentTrackIDs]
        };
      }),
      catchError(this.handleError('getSelfAlbums'))
    );
  }

  public fetchAllTimeArtists(): Observable<{}> {
    return this.http.get(this.apiAllTimeArtists).pipe(
      map((artists: {items: [{id: string, popularity: number, genres: []}]}) => {
        let allTimeObscurifyScore = 0;
        // const genres: any = {};
        // const topGenres: any = [];
        const allTimeArtistIDs = [];

        // Loop Through All Time Artists
        // Get Obscure Score and Top Genres
        for (let i = 0; i < artists.items.length; i++) {

          allTimeObscurifyScore = allTimeObscurifyScore + (50 / artists.items.length) *
            Math.floor(artists.items[i].popularity * (1 - i / artists.items.length));

          allTimeArtistIDs.push(artists.items[i].id);
        }



        allTimeObscurifyScore =  Math.floor(allTimeObscurifyScore / 10);

        return {
          allTimeArtists: artists.items,
          allTimeObscurifyScore: (allTimeObscurifyScore),
          allTimeArtistIDs: (allTimeArtistIDs)
        };
      }),
      catchError(this.handleError('getSelfAlbums'))
    );
  }

  public fetchCurrentArtists(): Observable<{}> {
    return this.http.get(this.apiCurrentArtists).pipe(
      map((artists: {items: [{id: string, popularity: any}]}) => {
        let recentObscurifyScore = 0;
        const currentArtistsIDs = [];

        for (let i = 0; i < artists.items.length; i++) {

          currentArtistsIDs.push(artists.items[i].id);

          recentObscurifyScore = recentObscurifyScore + (50 / artists.items.length) *
            Math.floor(artists.items[i].popularity * (1 - i / artists.items.length));
        }

        recentObscurifyScore = Math.floor(recentObscurifyScore / 10);

        return {
          currentArtistIDs: [...currentArtistsIDs],
          currentArtists: artists.items,
          recentObscurifyScore: (recentObscurifyScore)
        };

      }),
      catchError(this.handleError('getSelfAlbums'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      (result as any) = error;
      return of(result as T);
    };
  }
}
