import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';
import { NavController, Events, Slides, Content, IonicPage, NavParams } from 'ionic-angular';

import { AboutPage } from '../about/about';
import { LoginPage } from '../login/login';

import { RestProvider } from '../../providers/rest/rest';

@IonicPage({
  name: 'page-home',
  segment: 'home/:token'
})
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit{
  @Input()
  @ViewChild(Content) content: Content;
  @ViewChild(Slides) slides: Slides;
  @ViewChild('myMusic') myMusic;

  displayName: string;
  imageURL: string = "";
  country: string = "";
  obscurifyScore: number;
  recentObscurifyScore: number;
  percentileByCountry: number;
  userCountByCountry: number;
  totalUserCount: number;
  topGenres: any[];
  globalAverageScore: any;
  countryAverageScore: any;
  doneLoading: boolean = false;
  graphData: object;
  percentileData: object;
  currentListSlideIndex: number = 0;
  graphInit: boolean = false;

  constructor(public navCtrl: NavController, public events: Events, private restProvider: RestProvider, public el: ElementRef, private params: NavParams) {


  }

  ngOnInit() {
    this.restProvider.getData(this.params.get('token'));

    this.events.subscribe('user:login', () => {
      this.displayName = this.restProvider.userData.displayName;
      this.imageURL = this.restProvider.userData.imageURL;
      this.country = this.restProvider.userData.country;
      this.countryAverageScore = this.restProvider.userData.averageScore;
      this.obscurifyScore = this.restProvider.userData.obscurifyScore;
      this.recentObscurifyScore = this.restProvider.userData.recentObscurifyScore;
      this.globalAverageScore = Math.round(this.restProvider.userData.globalAverageScore);
      this.percentileByCountry = Math.round(this.restProvider.userData.percentileByCountry);
      this.userCountByCountry = this.restProvider.userData.userCountByCountry;
      this.totalUserCount = this.restProvider.userData.totalUserCount;
      this.topGenres = this.restProvider.userData.topGenres;
      this.doneLoading = this.restProvider.doneLoading;

      this.graphData = {
        allTimeObscurifyScore: this.restProvider.userData.obscurifyScore,
        recentObscurifyScore: this.restProvider.userData.recentObscurifyScore,
        globalAverageScore: Math.round(this.restProvider.userData.globalAverageScore),
        countryAverageScore: Math.round(this.restProvider.userData.averageScore),
        label: this.country,
        userCount: this.totalUserCount
      };

      this.percentileData = {
        percentileByCountry: this.percentileByCountry,
        userCountByCountry: this.userCountByCountry,
        label: this.country
      };
    });

    this.events.subscribe('user:error', () => {
      this.navCtrl.push(LoginPage);
    });

    this.events.subscribe('scrollToMusicTop', () => {
      this.scrollToMusicTop();
    });
  }


  slideChanged() {
    this.events.publish('graphInit');
  }

  openAboutPage() {
    this.navCtrl.push(AboutPage);
  }

  scrollToMusicTop(){
    let y = this.myMusic.nativeElement.offsetTop;
    this.content.scrollTo(0, y);
  }

  scrollToBottom(){
    this.content.scrollToBottom();
  }

}
