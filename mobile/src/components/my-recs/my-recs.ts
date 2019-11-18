import { Component } from '@angular/core';
import { Events } from 'ionic-angular';
import { RestProvider } from '../../providers/rest/rest';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Generated class for the MyRecsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */

@Component({
  selector: 'my-recs',
  templateUrl: 'my-recs.html'
})
export class MyRecsComponent {

  recommendedTracks : any;
  currentlySelected : any;
  desiredObscurity : number = 50;
  filter: boolean;

  constructor(public events: Events, public restProvider: RestProvider, public sanitizer: DomSanitizer) {
    this.recommendedTracks = this.restProvider.userData.recommendedTracks;
    this.filter = false;

    events.subscribe('getMoreLikeThisClicked', () => {
          if(this.restProvider.currentlyRecommendingArtist != undefined){
            if(this.restProvider.currentlyRecommendingArtist.name != this.currentlySelected){
              this.currentlySelected = {
                'trackName' : null,
                'artistName' : this.restProvider.currentlyRecommendingArtist.name,
                'popularity' : this.restProvider.currentlyRecommendingArtist.popularity,
                'artistID' : this.restProvider.currentlyRecommendingArtist.id,
                'albumName' : null
              };
              this.getRecommendations(this.currentlySelected);
            }
          }
    });
  }

  makePlaylist(tracks: any[], playlistName){

    this.restProvider.makePlaylist(tracks, playlistName).then(function(results: any){});

  }

  getRecommendations(artist: any){
    this.currentlySelected = artist;
    let that = this;
    this.restProvider.getRecommendations(artist.artistID, (100-this.desiredObscurity)).then(function(results){
      that.recommendedTracks = that.restProvider.userData.recommendedTracks;
    });
  }

  // toggleFilter() {
  //   this.filter = !this.filter;
  // }
  // getMore(){

  //   if(this.currentlySelected == undefined){
  //     let randomlySelectedArtist;
  //     if(this.restProvider.userData.shortTermArtists.items.length > 9){
  //       randomlySelectedArtist = this.restProvider.userData.shortTermArtists.items[Math.floor(Math.random() * 9)];
  //     }
  //     else{
  //       randomlySelectedArtist = this.restProvider.userData.longTermArtists.items[Math.floor(Math.random() * 9)];
  //     }
  //     this.currentlySelected = {
  //       'trackName' : null,
  //       'artistName' : randomlySelectedArtist.name,
  //       'popularity' : randomlySelectedArtist.popularity,
  //       'artistID' : randomlySelectedArtist.id,
  //       'albumName' : null
  //     };
  //   }

  //   let that = this;
  //   this.restProvider.getRecommendations(this.currentlySelected.artistID, (100-this.desiredObscurity)).then(function(results){
  //     that.recommendedTracks = that.restProvider.userData.recommendedTracks;
  //   });
  // }

}
