import { Component, OnInit, Output, EventEmitter, ElementRef, AfterViewInit, Input, OnChanges,SimpleChanges } from '@angular/core';
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
  @Output() audioData = new EventEmitter<{}>();

  constructor(public element: ElementRef, public intersectionObserverService: IntersectionObserverService) { }

  public show = false;

  public happinessGraphData;
  public danceabilityGraphData;
  public energyGraphData;
  public acousticnessGraphData;

  private intersectionObserverSubs: Subscription;
  private longTermAudioFeatures = {
    danceability : 0,
    energy : 0,
    happiness : 0,
    acousticness : 0,
    tracksCounted : 0
  };
  private shortTermAudioFeatures = {
    danceability : 0,
    energy : 0,
    happiness : 0,
    acousticness : 0,
    tracksCounted : 0
  };

  ngOnChanges(changes: SimpleChanges) {
    if(!changes.data.firstChange && changes.data.previousValue.country != changes.data.currentValue.country) {
      this.createAudioFeatures();
    };
  }

  ngOnInit() {
    this.createAudioFeatures();
    this.audioData.emit(this.longTermAudioFeatures);

  }

  private createAudioFeatures() {
    this.longTermAudioFeatures = {
      danceability : 0,
      energy : 0,
      happiness : 0,
      acousticness : 0,
      tracksCounted : 0
    };
    this.shortTermAudioFeatures = {
      danceability : 0,
      energy : 0,
      happiness : 0,
      acousticness : 0,
      tracksCounted : 0
    };
    for (const track of this.data.userAudioFeatures[0].audio_features) {
      if (track != null) {
        this.longTermAudioFeatures.danceability += track.danceability;
        this.longTermAudioFeatures.energy += track.energy;
        this.longTermAudioFeatures.happiness += track.valence;
        this.longTermAudioFeatures.acousticness += track.acousticness;
        this.longTermAudioFeatures.tracksCounted += 1;
      }
    }

    this.longTermAudioFeatures.danceability /= this.longTermAudioFeatures.tracksCounted;
    this.longTermAudioFeatures.energy /= this.longTermAudioFeatures.tracksCounted;
    this.longTermAudioFeatures.happiness /= this.longTermAudioFeatures.tracksCounted;
    this.longTermAudioFeatures.acousticness /= this.longTermAudioFeatures.tracksCounted;

    for (const track of this.data.userAudioFeatures[1].audio_features) {
      if (track != null) {
        this.shortTermAudioFeatures.danceability += track.danceability;
        this.shortTermAudioFeatures.energy += track.energy;
        this.shortTermAudioFeatures.happiness += track.valence;
        this.shortTermAudioFeatures.acousticness += track.acousticness;
        this.shortTermAudioFeatures.tracksCounted += 1;
      }
    }

    this.shortTermAudioFeatures.danceability /= this.shortTermAudioFeatures.tracksCounted;
    this.shortTermAudioFeatures.energy /= this.shortTermAudioFeatures.tracksCounted;
    this.shortTermAudioFeatures.happiness /= this.shortTermAudioFeatures.tracksCounted;
    this.shortTermAudioFeatures.acousticness /= this.shortTermAudioFeatures.tracksCounted;

    this.happinessGraphData = {
      type: 'Happiness',
      current: this.createPercent(this.shortTermAudioFeatures, 'happiness'),
      allTime: this.createPercent(this.longTermAudioFeatures, 'happiness')
    };

    this.danceabilityGraphData = {
      type: 'Danceability',
      current: this.createPercent(this.shortTermAudioFeatures, 'danceability'),
      allTime: this.createPercent(this.longTermAudioFeatures, 'danceability')
    };

    this.energyGraphData = {
      type: 'Energy',
      current: this.createPercent(this.shortTermAudioFeatures, 'energy'),
      allTime: this.createPercent(this.longTermAudioFeatures, 'energy')
    };

    this.acousticnessGraphData = {
      type: 'Acousticness',
      current: this.createPercent(this.shortTermAudioFeatures, 'acousticness'),
      allTime: this.createPercent(this.longTermAudioFeatures, 'acousticness')
    };
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
