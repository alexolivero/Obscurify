import { Component, ViewChild, Output, EventEmitter, OnInit } from '@angular/core';
import { Events, Slides } from 'ionic-angular';
import { DomSanitizer} from '@angular/platform-browser';
import { RestProvider } from '../../providers/rest/rest';
/**
 * Generated class for the MyMusicComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'my-music',
  templateUrl: 'my-music.html'
})
export class MyMusicComponent implements OnInit {

  @ViewChild(Slides) slides: Slides;
  @Output() scrollBottomEmit =  new EventEmitter<Boolean>();
  longTermArtists: any[];
  shortTermArtists: any[];
  longTermTracks: any[];
  shortTermTracks: any[];
  obscurifyScore: number;
  recentObscurifyScore: number;
  currentArtists: any[];
  currentTracks: any[];
  userHistory: any[];
  currentListSlideIndex: number = 0;
  relationship: string;
  filter: boolean;
  currentHeaderString: string = "Current";
  toggleShowMoreFlag: boolean = false;
  toggledButtonText: string = "Show More";
  sliceLimit: number = 10;

  constructor(public events: Events, public restProvider: RestProvider, public sanitizer: DomSanitizer) {
  }

  ngOnInit() {
    this.filter = false;
    this.longTermArtists = this.restProvider.userData.longTermArtists;
    for (let i=0; i < this.longTermArtists.length; i++) { this.longTermArtists[i].expanded = false; }
    if (this.longTermArtists.length > 0) {
        this.longTermArtists[0].expanded = true;
    }

    this.shortTermArtists = this.restProvider.userData.shortTermArtists;
    for (let i=0; i < this.shortTermArtists.length; i++) { this.shortTermArtists[i].expanded = false; }
    if (this.shortTermArtists.length > 0) {
        this.shortTermArtists[0].expanded = true;
    }
    this.currentArtists = this.shortTermArtists;

    this.longTermTracks = this.restProvider.userData.longTermTracks;
    for (let i=0; i < this.longTermTracks.length; i++) { this.longTermTracks[i].expanded = false; }
    if (this.longTermTracks.length > 0) {
        this.longTermTracks[0].expanded = true;
    }

    this.shortTermTracks = this.restProvider.userData.shortTermTracks;
    for(let i=0; i < this.shortTermTracks.length; i++){ this.shortTermTracks[i].expanded = false; }
    if (this.shortTermTracks.length > 0) {
        this.shortTermTracks[0].expanded = true;
    }
    this.currentTracks = this.shortTermTracks;
    this.userHistory = this.restProvider.userData.userHistory;
    this.obscurifyScore = this.restProvider.userData.obscurifyScore;
    this.recentObscurifyScore = this.restProvider.userData.recentObscurifyScore;
    if (this.userHistory == null || this.userHistory == undefined) {
        this.userHistory = [];
    }
    this.userHistory.unshift({
      "formattedDate" : "Current"
    });
    this.relationship = this.userHistory[0].formattedDate;
    this.currentHeaderString = "My Current";
  }

  goToRecommendations(artist: any) {
    this.scrollBottomEmit.emit(true);
    this.restProvider.currentlyRecommendingArtist = artist;
    this.events.publish('getMoreLikeThisClicked');
  }

  slideChanged() {
    this.currentListSlideIndex = this.slides.getActiveIndex();
  }

  onChange(history: any){
    if (history.formattedDate != "Current") {
      let that = this;
      this.restProvider.getHistoryItems(history).then(function(results: any) {
        that.currentHeaderString = history.formattedDate;
        that.shortTermTracks = results.tracks;
        for(let i=0; i < that.shortTermTracks.length; i++){ that.shortTermTracks[i].expanded = false; }
        for(let i=0; i < that.shortTermArtists.length; i++){ that.shortTermArtists[i].expanded = false; }
        that.shortTermArtists = results.artists;
        that.shortTermArtists[0].expanded = true;
        that.shortTermTracks[0].expanded = true;
      });
    }
    else {
      this.currentHeaderString = "My Current";
      this.shortTermTracks = this.currentTracks;
      this.shortTermArtists = this.currentArtists;
      this.shortTermArtists[0].expanded = true;
    }
  }


  makePlaylist(tracks: any[], playlistName) {
    if (playlistName == "Current") {
      let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      let dateObj = new Date();
      let month = monthNames[dateObj.getMonth()]; //months from 1-12
      let day = dateObj.getDate();
      let year = dateObj.getFullYear() % 100;
      let newdate = month + " " + day + " '" + year;
      playlistName = newdate + ' // Obscurify';
    }
    this.restProvider.makePlaylist(tracks, playlistName).then(function(results: any){});
  }

  setActiveListItem(item: any, arr: any) {
    for (let value of arr) {
        value.expanded = false;
    }
    item.expanded = !item.expanded;
  }

  toggleFilter() {
    if (this.userHistory.length == 1 && this.userHistory[0].formattedDate == "Current") {
      let that = this;
      this.restProvider.getHistoryIDs().then(function(results: any){
        that.userHistory = results.userHistory;
      });
    }
    this.filter = !this.filter;
  }

  toggleShowMore() {
      if (this.toggleShowMoreFlag) {
          this.events.publish('scrollToMusicTop');
          this.toggleShowMoreFlag = false;
          this.toggledButtonText = "Show More";
          this.sliceLimit = 10;
      }
      else {
          this.toggleShowMoreFlag = true;
          this.toggledButtonText = "Show Less";
          this.sliceLimit = 50;
      }

  }

}
