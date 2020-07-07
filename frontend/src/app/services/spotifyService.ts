import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { forkJoin } from 'rxjs';


@Injectable()
export class SpotifyService {

  userData: any;

  constructor(
      public http: HttpClient,
      public platform: Platform) {
  }

    getArtists(config) {
      const url = `https://api.spotify.com/v1/artists?ids=${config.artistIDs.join()}`;

      return new Promise((resolve, reject) => {
        this.http.get(url).subscribe((data: any) => {
          resolve(data);
        }, err => {
          reject(err);
        });
      });
    }

    getTracks(config) {
      const url = `https://api.spotify.com/v1/tracks?ids=${config.trackIDs.join()}`;

      return new Promise((resolve, reject) => {
        this.http.get(url).subscribe((data: any) => {
          resolve(data);
        }, err => {
          reject(err);
        });
      });
    }

    getAudioFeatures(config) {
      if (config.allTimeTrackIDs && config.currentTrackIDs) {
        const longTermUrl = `https://api.spotify.com/v1/audio-features?ids=${config.allTimeTrackIDs.join()}`;
        const currentUrl = `https://api.spotify.com/v1/audio-features?ids=${config.currentTrackIDs.join()}`;

        const longTermRequest = this.http.get(longTermUrl);
        const currentRequest = this.http.get(currentUrl);

        return forkJoin([longTermRequest, currentRequest]);
      }
    }

    getRecommendations(config) {
      let url;
      if (config.allTimeArtistIDs.length > 0 &&
        config.allTimeTrackIDs.length > 0 &&
        config.currentArtistIDs.length > 0 &&
        config.currentTrackIDs.length > 0) {
          url = 'https://api.spotify.com/v1/recommendations?seed_artists=' +
          config.allTimeArtistIDs[Math.floor(Math.random() * config.allTimeArtistIDs.length)] + ',' +
          config.currentArtistIDs[Math.floor(Math.random() * config.currentArtistIDs.length)] + '&seed_tracks='
          + config.allTimeTrackIDs[Math.floor(Math.random() * config.allTimeTrackIDs.length)] + ','
              + config.currentTrackIDs[Math.floor(Math.random() * config.currentTrackIDs.length)]
                  + '&market=' + config.country + '&max_popularity=55' + '&min_popularity=15' + '&limit=15';
      } else if (config.allTimeArtistIDs.length > 0 &&
        config.allTimeTrackIDs.length > 0 &&
        config.currentArtistIDs.length <= 0 &&
        config.currentTrackIDs.length <= 0) {
          url = 'https://api.spotify.com/v1/recommendations?seed_artists=' +
          config.allTimeArtistIDs[Math.floor(Math.random() * config.allTimeArtistIDs.length)] + '&seed_tracks='
          + config.allTimeTrackIDs[Math.floor(Math.random() * config.allTimeTrackIDs.length)]
                  + '&market=' + config.country + '&max_popularity=55' + '&min_popularity=15' + '&limit=15';

      } else {
        url = 'https://api.spotify.com/v1/recommendations?seed_artists=' +
        config.currentArtistIDs[Math.floor(Math.random() * config.currentArtistIDs.length)] + '&seed_tracks='
            + config.currentTrackIDs[Math.floor(Math.random() * config.currentTrackIDs.length)]
                + '&market=' + config.country + '&max_popularity=55' + '&min_popularity=15' + '&limit=15';
      }

      return new Promise((resolve, reject) => {
        this.http.get(url).subscribe((data: any) => {
          resolve(data);
        }, err => {
          reject(err);
        });
      });
    }

    makePlaylist(config) {
      const {userID, token, playlistName, tracks} = config;
      const url =  'https://api.spotify.com/v1/users/' + userID + '/playlists';
      const headers = new HttpHeaders()
            .set('Authorization',  'Bearer ' + token)
            .set('Accept', 'application/json');

      const that = this;
      return new Promise((resolve, reject) => {
        this.http.post(url, { name: playlistName }, { headers: (headers) }).subscribe((data: any) => {
          resolve(data);
          const uriArray = [];
          const playlistID = data.id;

          for (const track of tracks) {
            uriArray.push(track.uri);
          }
          that.fillPlaylistWithTracks(config, uriArray, playlistID);
        }, (err) => {
          reject(err);
        });
      });
    }


    fillPlaylistWithTracks(config, uriArray: any[], playlistID: string) {
      const url =  'https://api.spotify.com/v1/users/' + config.userID + '/playlists/' + playlistID + '/tracks';
      const headers = new HttpHeaders()
            .set('Authorization',  'Bearer ' )
            .set('Accept', 'application/json');
      return new Promise((resolve, reject) => {
        this.http.post(url, { uris: uriArray }, { headers: (headers) }).subscribe((data: any) => {
          resolve(data);

        }, (err) => {
          reject(err);
        });
      });
    }



}
