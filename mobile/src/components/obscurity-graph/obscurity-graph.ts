import { Component, ViewChild, Renderer2, Input, ElementRef, OnInit } from '@angular/core';
import { Events } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'obscurity-graph',
  templateUrl: 'obscurity-graph.html'
})
export class ObscurityGraphComponent implements OnInit {

  @Input() data;
  @ViewChild('globalAvgBar') globalBar;
  @ViewChild('countryAvgBar') countryBar;
  @ViewChild('allTimeBar') allTimeBar;
  @ViewChild('recentBar') recentBar;

  displayName: string;
  imageURL: string = "";
  country: string = "";
  allTimeObscurifyScore: number;
  recentObscurifyScore: number;
  countryAverageScore: number;
  globalAverageScore: number;
  percentileByCountry: number;
  userCountByCountry: number;
  totalUserCount: number;
  topGenres: any[];
  longTermAudioFeatures: any;
  shortTermAudioFeatures: any;
  audioFeatureAverages: any;
  doneLoading: boolean = false;
  scoreArray: any[];
  highestScoreElement;
  highestScore: number;
  lowestScore: number;
  barActive: boolean = false;

  constructor(public events: Events, private renderer: Renderer2, public el: ElementRef, public sanitizer: DomSanitizer) {


    events.subscribe('graphInit', () => {

      this.setGraph();
    });

  }

  ngOnInit(): void {
    this.allTimeObscurifyScore = this.data.allTimeObscurifyScore;
    this.recentObscurifyScore = this.data.recentObscurifyScore;
    this.globalAverageScore = this.data.globalAverageScore;
    this.countryAverageScore = this.data.countryAverageScore;

    this.scoreArray = [[this.countryAverageScore, this.countryBar],
    [this.globalAverageScore, this.globalBar],
    [this.allTimeObscurifyScore, this.allTimeBar],
    [this.recentObscurifyScore, this.recentBar]];
  }



  setGraph(): void {
    function sort(array) {
      array.sort(function(a,b) {
        return b[0]-a[0]
      });
    };
    if (!this.doneLoading){

      sort(this.scoreArray)
      let sortedArray = this.scoreArray;
      this.highestScore = sortedArray[0][0];
      //this.lowestScore = sortedArray[sortedArray.length - 1][0];
      // highestScoreElement = sortedArray[0][1];
      this.renderer.setStyle(sortedArray[0][1].nativeElement, 'height', '100%');
      this.barActive = true;
      // highest score from array
      sortedArray.shift();
      var graphHeight;
      for (let i = 0; i < sortedArray.length; i++) {
        graphHeight = 100 - (Math.round(((this.highestScore / sortedArray[i][0]) - 1) * 100));
        this.renderer.setStyle(sortedArray[i][1].nativeElement, 'height', String(graphHeight)+'%');

      }
      this.doneLoading = true;
    }

  }

}
