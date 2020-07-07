import { Component, OnInit, Output, EventEmitter, ElementRef, AfterViewInit, Input } from '@angular/core';
import { IntersectionObserverService } from 'src/app/services/intersectionObserver';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-moods-graph',
  templateUrl: './moods-graph.component.html',
  styleUrls: ['./moods-graph.component.scss'],
  providers: [IntersectionObserverService]
})
export class MoodsGraphComponent implements OnInit, AfterViewInit {
  @Input() data;
  @Output() appColor = new EventEmitter<number>();
  @Output() audioData = new EventEmitter<{}>();

  constructor(public element: ElementRef, public intersectionObserverService: IntersectionObserverService) { }

  public show = false;

  public longTermAudioFeatures;
  public shortTermAudioFeatures;

  public happinessGraphData;
  public danceabilityGraphData;
  public energyGraphData;
  public acousticnessGraphData;

  private intersectionObserverSubs: Subscription;

  ngOnInit() {

    const longTermAudioFeatures = {
      danceability : 0,
      energy : 0,
      happiness : 0,
      acousticness : 0,
      tracksCounted : 0
    };

    const shortTermAudioFeatures = {
      danceability : 0,
      energy : 0,
      happiness : 0,
      acousticness : 0,
      tracksCounted : 0
    };

    for (const track of this.data.userAudioFeatures[0].audio_features) {
      if (track != null) {
        longTermAudioFeatures.danceability += track.danceability;
        longTermAudioFeatures.energy += track.energy;
        longTermAudioFeatures.happiness += track.valence;
        longTermAudioFeatures.acousticness += track.acousticness;
        longTermAudioFeatures.tracksCounted += 1;
      }
    }

    longTermAudioFeatures.danceability /= longTermAudioFeatures.tracksCounted;
    longTermAudioFeatures.energy /= longTermAudioFeatures.tracksCounted;
    longTermAudioFeatures.happiness /= longTermAudioFeatures.tracksCounted;
    longTermAudioFeatures.acousticness /= longTermAudioFeatures.tracksCounted;

    for (const track of this.data.userAudioFeatures[1].audio_features) {
      if (track != null) {
        shortTermAudioFeatures.danceability += track.danceability;
        shortTermAudioFeatures.energy += track.energy;
        shortTermAudioFeatures.happiness += track.valence;
        shortTermAudioFeatures.acousticness += track.acousticness;
        shortTermAudioFeatures.tracksCounted += 1;
      }
    }

    shortTermAudioFeatures.danceability /= shortTermAudioFeatures.tracksCounted;
    shortTermAudioFeatures.energy /= shortTermAudioFeatures.tracksCounted;
    shortTermAudioFeatures.happiness /= shortTermAudioFeatures.tracksCounted;
    shortTermAudioFeatures.acousticness /= shortTermAudioFeatures.tracksCounted;

    this.happinessGraphData = {
      type: 'Happiness',
      current: this.createPercent(shortTermAudioFeatures, 'happiness'),
      allTime: this.createPercent(longTermAudioFeatures, 'happiness')
    };

    this.danceabilityGraphData = {
      type: 'Danceability',
      current: this.createPercent(shortTermAudioFeatures, 'danceability'),
      allTime: this.createPercent(longTermAudioFeatures, 'danceability')
    };

    this.energyGraphData = {
      type: 'Energy',
      current: this.createPercent(shortTermAudioFeatures, 'energy'),
      allTime: this.createPercent(longTermAudioFeatures, 'energy')
    };

    this.acousticnessGraphData = {
      type: 'Acousticness',
      current: this.createPercent(shortTermAudioFeatures, 'acousticness'),
      allTime: this.createPercent(longTermAudioFeatures, 'acousticness')
    };

    this.audioData.emit(longTermAudioFeatures);

  }

  private createPercent(feature, type) {
    const ratioObject = {
      ratio: 0,
      message: '',
      level: ''
    };

    const ratio = feature[type] / this.data.audioFeatureAverages[type].N;
    let percentDifference;

    if (ratio == null || ratio === 0) {
      ratioObject.message = 'no data found';
    } else if (ratio > 1.009) {
      percentDifference = ratio * 100 - 100;
      ratioObject.message = percentDifference.toFixed(1) + '% higher than the ' + this.data.country + ' average';
    } else if (ratio < 0.999) {
      percentDifference = 100 - ratio * 100;
      ratioObject.message = percentDifference.toFixed(1) + '% lower than the '  + this.data.country + ' average';
    } else {
      ratioObject.message = 'right at the ' + this.data.country + ' average';
    }
    ratioObject.ratio = ratio;
    ratioObject.level = this.createLevel(ratio);

    return ratioObject;

  }

  private createLevel(ratio) {
    if (ratio > 1.8) {
      return 'level-nine';
    } else if (ratio > 1.4) {
      return 'level-eight';
    } else if (ratio > 1.2) {
      return 'level-seven';
    } else if (ratio > 1.05) {
      return 'level-six';
    } else if (ratio > 0.95) {
      return 'level-five';
    } else if (ratio > 0.8) {
      return 'level-four';
    } else if (ratio > 0.6) {
      return 'level-three';
    } else if (ratio > 0.4) {
      return 'level-two';
    } else {
      return 'level-one';
    }
  }


  ngAfterViewInit(): void {
    this.intersectionObserverService.init(this.element.nativeElement, {
      threshold: 0.30
    });
    this.intersectionObserverSubs = this.intersectionObserverService
    .getSubject()
    .subscribe(el => {

      if (el.isIntersecting) {
        this.show = true;
      } else {
        this.show = false;
      }
    });

  }

}
