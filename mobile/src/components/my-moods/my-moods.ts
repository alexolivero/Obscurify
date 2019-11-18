import { Component, ViewChild } from '@angular/core';
import { Events, Slides } from 'ionic-angular';
import { RestProvider } from '../../providers/rest/rest';
import { DomSanitizer } from '@angular/platform-browser';
/**
 * Generated class for the MyMoodsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'my-moods',
  templateUrl: 'my-moods.html'
})
export class MyMoodsComponent{
  @ViewChild(Slides) slides: Slides;
  text: string;
  moodData: any;
  happinessData: any;
  danceabilityData: any;
  energyData: any;
  acousticnessData: any;
  moodDataList: any = [];
  backgroundColorList: any = [['#FBFF9E', '#A29EFF'], ['#A9C4E5', '#E5CAA9'], ['#FFA69E', '#9EF7FF'],['#E5CAA9', '#A9C4E5'], ['#E5CAA9','#A9C4E5']];
  bgColor: any = ['#FBFF9E', '#A29EFF'];

  constructor(public events: Events, public restProvider: RestProvider, public sanitizer: DomSanitizer) {
    this.moodData = {
      longTermAudioFeatures: this.restProvider.userData.longTermAudioFeatures,
      shortTermAudioFeatures: this.restProvider.userData.shortTermAudioFeatures,
      audioFeatureAverages: this.restProvider.userData.audioFeatureAverages,
      country: this.restProvider.userData.country
    };
    if(this.moodData.shortTermAudioFeatures == null){
        this.moodData.shortTermAudioFeatures = {
            "happiness": null,
            "danceability": null,
            "acousticness": null,
            "energy": null
        }
    }
    if(this.moodData.longTermAudioFeatures == null){
        this.moodData.longTermAudioFeatures = {
            "happiness": null,
            "danceability": null,
            "acousticness": null,
            "energy": null
        }
    }
    let audioFeatureAverages = {
        "happiness": null,
        "danceability": null,
        "acousticness": null,
        "energy": null
    }
    if (this.moodData.audioFeatureAverages != null) {
      audioFeatureAverages = this.moodData.audioFeatureAverages;
      Object.keys(audioFeatureAverages).forEach(function(key) {
          audioFeatureAverages[key] = audioFeatureAverages[key].N;
      });
    }
    this.happinessData = {
      type: 'Happiness',
      score: {
        allTime: this.moodData.longTermAudioFeatures.happiness,
        recent: this.moodData.shortTermAudioFeatures.happiness,
        average: audioFeatureAverages.happiness
      }
    }
    this.danceabilityData = {
      type: 'Danceability',
      score: {
        allTime: this.moodData.longTermAudioFeatures.danceability,
        recent: this.moodData.shortTermAudioFeatures.danceability,
        average: audioFeatureAverages.danceability
      }
    }
    this.energyData = {
      type: 'Energy',
      score: {
        allTime: this.moodData.longTermAudioFeatures.energy,
        recent: this.moodData.shortTermAudioFeatures.energy,
        average: audioFeatureAverages.energy
      }
    }
    this.acousticnessData = {
      type: 'Acousticness',
      score: {
        allTime: this.moodData.longTermAudioFeatures.acousticness,
        recent: this.moodData.shortTermAudioFeatures.acousticness,
        average: audioFeatureAverages.acousticness
      }
    }

    this.moodDataList = [this.happinessData, this.danceabilityData, this.energyData, this.acousticnessData];
  }

  slideChanged() {
    this.bgColor = this.backgroundColorList[this.slides.getActiveIndex()];
    if (this.slides.getActiveIndex() === this.slides.length() - 1) {
      this.slides.lockSwipeToNext(true);
    }
    else {
      this.slides.lockSwipeToNext(false);
    }
  }
}
