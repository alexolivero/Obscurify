import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Generated class for the MyMoodsGraphComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'my-moods-graph',
  templateUrl: 'my-moods-graph.html'
})
export class MyMoodsGraphComponent implements OnInit {
  @Input() data: any;
  @Input() bgColor: any;
  @Input() country: string;
  text: string;
  allTime: object;
  recent: object;
  allTimeLevel: string;
  recentLevel: string;

  constructor(public sanitizer: DomSanitizer) {
  }

  private createPercent(data) {
    let percentDifference;
    let ratio = null;
    try{
        ratio = this.data.score[data] / this.data.score.average;
    }
    catch(e){}
    if(ratio == null || ratio == 0){
        this[data] = "no data found"
    }
    else if(ratio > 1.009){
      percentDifference = ratio * 100 - 100;
      this[data] = percentDifference.toFixed(1) + "% higher than the " + this.country + " average";
    }
    else if(ratio < 0.999){
      percentDifference = 100 - ratio*100;
      this[data] = percentDifference.toFixed(1) + "% lower than the "  + this.country + " average";
    }
    else{
      this[data] = "right at the " + this.country + " average";
    }
  }

  private getLevel(ratio) {
    if(ratio > 1.8){return "level-nine";}
      else if(ratio > 1.4){return "level-eight";}
      else if(ratio > 1.2){return "level-seven";}
      else if(ratio > 1.05){return "level-six";}
      else if(ratio > 0.95){return "level-five";}
      else if(ratio > 0.8){return "level-four";}
      else if(ratio > 0.6){return "level-three";}
      else if(ratio > 0.4){return "level-two";}
      else{ return "level-one";}
  }

  ngOnInit() {
    this.createPercent('allTime');
    this.createPercent('recent');
    //TOGO create setting for all time and recent average percentages.

    try{
        this.allTimeLevel = this.getLevel(this.data.score.allTime / this.data.score.average);
        this.recentLevel = this.getLevel(this.data.score.recent / this.data.score.average);
    }
    catch(e){
        this.allTimeLevel = "level-one";
        this.recentLevel = "level-one";
    }

  }




}
