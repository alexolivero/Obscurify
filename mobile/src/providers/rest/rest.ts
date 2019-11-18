import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Platform, Events, AlertController } from 'ionic-angular';
import { Injectable } from '@angular/core';


@Injectable()
export class RestProvider {

  token: string = '';
  doneLoading: boolean = false;
  userData: any;
  currentlyRecommendingArtist: any;

  constructor(public http: HttpClient, public platform: Platform, public events: Events, private alertCtrl: AlertController) {

    this.userData = {
      displayName : "",
      imageURL : "",
      country : "",
      longTermArtists : [],
      shortTermArtists : [],
      longTermTracks : [],
      shortTermTracks : [],
      obscurifyScore : -1,
      recentObscurifyScore : -1,
      globalAverageScore : -1,
      averageScore : 1,
      recommendedTracks : [],
      percentileByCountry : -1,
      userCountByCountry: -1,
      totalUserCount: -1,
      topGenres : [],
      userID : "",
      userHistory : [],
      longTermAudioFeatures : {},
			shortTermAudioFeatures : {},
			audioFeatureAverages : {}
    };

  }

    getData(token: string){
      this.token = token;
      return new Promise(resolve => {
        this.http.get('https://obscurifymusic.com/spotifyData/' + token + '/getUserData').subscribe((data : any) => {
          resolve(data);
          this.userData = data;
          if(this.userData.displayName != null && this.userData.displayName.indexOf(' ') > 0){
      			this.userData.displayName = " " + this.userData.displayName.substring(0, this.userData.displayName.indexOf(' '));
      		}
      		else if(this.userData.displayName == null){
      			this.userData.displayName = "";
      		}
      		if(this.userData.imageURL.length > 0){
      			this.userData.imageURL = this.userData.imageURL[0].url;
      		} else{
      			this.userData.imageURL = null;
      		}

          this.doneLoading = true;
          this.events.publish('user:login');

        }, err => {
          console.log('rest.ts', err);
          this.events.publish('user:error');
        });
      });
    }


    getRecommendations(artistID: string, desiredObscurity: number){
      let url = 'https://obscurifymusic.com/spotifyData/getRecommendations?country=' + this.userData.country +
        "&accessToken=" + this.token + "&artistID=" + artistID + "&desiredObscurity=" + desiredObscurity;

      return new Promise(resolve => {
        this.http.get(url).subscribe((data : any) => {
          resolve(data);
          this.userData.recommendedTracks = data.recommendedTracks;
        }, err => {
          console.log('rest.ts', err);
        });
      });
    }

    makePlaylist(tracks: any[], playlistName: string){
      let url =  'https://api.spotify.com/v1/users/' + this.userData.userID + '/playlists';
      const headers = new HttpHeaders()
            .set("Authorization",  "Bearer " + this.token)
            .set("Accept", "application/json");
      let that = this;
      return new Promise(resolve => {
        this.http.post(url, { name: playlistName }, { headers: headers }).subscribe((data : any) => {
          resolve(data);
          let uri_array = [];
          let playlist_id = data.id;

          for(let i = 0; i < tracks.length; i++){
            uri_array.push(tracks[i].uri);
          }
          that.fillPlaylistWithTracks(uri_array, playlist_id, playlistName);
        }, err => {
          console.log('rest.ts', err);
        });
      });
    }


    fillPlaylistWithTracks(uri_array: any[], playlist_id: string, playlistName: string){
      let url =  'https://api.spotify.com/v1/users/' + this.userData.userID + '/playlists/' + playlist_id + '/tracks';
      const headers = new HttpHeaders()
            .set("Authorization",  "Bearer " + this.token)
            .set("Accept", "application/json");
      return new Promise(resolve => {
        this.http.post(url, { uris: uri_array }, { headers: headers }).subscribe((data : any) => {
          resolve(data);
          let alert = this.alertCtrl.create({
            title: "Playlist created",
            subTitle: "\"" + playlistName + "\" was created in your Spotify library!",
            buttons: ['Great!']
          });
          alert.present();
        }, err => {
          console.log('rest.ts', err);
        });
      });
    }


    getHistoryItems(history: any){
      let url = 'https://obscurifymusic.com/spotifyData/getHistoryItems?artistIDs=' + history.shortTermArtistIDs.join() +
        "&trackIDs=" + history.shortTermTrackIDs.join() +
        "&accessToken=" + this.token;

      return new Promise(resolve => {
        this.http.get(url).subscribe((data : any) => {
          resolve(data);
        }, err => {
          console.log('rest.ts', err);
        });
      });
    }

}
