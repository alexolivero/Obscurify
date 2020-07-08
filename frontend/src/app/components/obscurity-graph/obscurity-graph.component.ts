import { Component, OnInit, Input, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Chart } from 'chart.js';
import * as pluginAnnotations from 'chartjs-plugin-annotation';

@Component({
  selector: 'app-obscurity-graph',
  templateUrl: './obscurity-graph.component.html',
  styleUrls: ['./obscurity-graph.component.scss']
})
export class ObscurityGraphComponent implements OnInit, OnChanges {
  @Input() data;

  constructor(public el: ElementRef, public sanitizer: DomSanitizer) {

  }

  public histogram: Chart;

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.data.firstChange && changes.data.previousValue.country !== changes.data.currentValue.country) {
      this.histogram.destroy();
      this.ngOnInit();
    }
  }

  ngOnInit() {
    const oldData = Object.entries(this.data.breakdown);
    const labels = [...oldData.map((val: any) => {
      if (Number(val[0]) >= 110  && val[0] <= 240) {
        return Number(val[0]);
      } else {
        return false;
      }
    })].filter((val) => {
      return val;
    });

    let tempMax = 0;
    const dataSet = [...oldData.map((val: any) => {
      if (Number(val[0]) >= 110  && val[0] <= 240) {
        if (Number(val[1].N) > tempMax) {
          tempMax = Number(val[1].N);
        }
        return Number(val[1].N);
      } else {
        return false;
      }
    })].filter((val) => {
      return val;
    });

    let userRecentScoreToDisplay = this.data.userRecentScore;
    if (userRecentScoreToDisplay > 240) {
      userRecentScoreToDisplay = 240;
    } else if (userRecentScoreToDisplay < 110) {
      userRecentScoreToDisplay = 110;
    }
    let userAllTimeScoreToDisplay = this.data.userAllTimeScore;
    if (userAllTimeScoreToDisplay > 240) {
      userAllTimeScoreToDisplay = 240;
    } else if (userAllTimeScoreToDisplay < 110) {
      userAllTimeScoreToDisplay = 110;
    }

    let allTimeXAdjust = 0;
    if (userAllTimeScoreToDisplay > 230) {
      allTimeXAdjust = 45;
    } else if (userAllTimeScoreToDisplay < 120) {
      allTimeXAdjust = -45;
    }
    let recentXAdjust = 0;
    if (userRecentScoreToDisplay > 230) {
      recentXAdjust = 45;
    } else if (userRecentScoreToDisplay < 120) {
      recentXAdjust = -45;
    }

    const userAllTimeAnnotation = {
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis-0',
      value: userAllTimeScoreToDisplay,
      borderColor: 'rgb(162, 158, 255)',
      borderWidth: 2,
      label: {
        fontColor: 'rgb(162, 158, 255)',
        content: `Your All Time ${Math.round(this.data.percentileByCountryAllTime)}%`,
        enabled: true,
        position: 'center',
        fontSize: 10,
        yAdjust: -40,
        xAdjust: allTimeXAdjust
      }
    };

    const userRecentAnnotation = {
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis-0',
      value: userRecentScoreToDisplay,
      borderColor: 'rgb(229, 202, 169)',
      borderWidth: 2,
      label: {
        fontColor: 'rgb(229, 202, 169)',
        content: `Your Recent ${Math.round(this.data.percentileByCountryRecent)}%`,
        enabled: true,
        position: 'center',
        yAdjust: -65,
        fontSize: 10,
        xAdjust: recentXAdjust
      }
    };

    // const globalAverageAnnotation = {
    //   type: 'line',
    //   mode: 'vertical',
    //   scaleID: 'x-axis-0',
    //   value: this.data.averageScoreGlobal,
    //   borderColor: 'rgb(169, 196, 229)',
    //   borderWidth: 2,
    //   z: 2,
    //   label: {
    //     fontColor: 'rgb(169, 196, 229)',
    //     content: `Global Avg ${this.data.averageScoreGlobal}`,
    //     enabled: true,
    //     position: 'center',
    //     fontSize: 10,
    //     yAdjust: -10
    //   }
    // };


    const data = {
      labels: (labels),
      datasets: [{
          data: dataSet,
          backgroundColor: '#fff'
      }]
    };
    const annotations = [userAllTimeAnnotation];
    if (this.data.userRecentScore > 0) {
      annotations.push(userRecentAnnotation);
    }
    const option = {
        global: {
          defaultFontColor: '#fff',
          defaultFontFamily	: '"Helvetica Neue", sans-serif'
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 3000
        },
      tooltips: {
            enabled: false
        },
      legend: {
          display: false
        },
      plugins: [
        pluginAnnotations
      ],
      annotation: {
        annotations: (annotations)
      },
      scales: {
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            fontColor: '#fff',
            labelString: 'User Count'
          },
          ticks: {
            fontColor: '#fff',
            stepSize: Math.ceil(tempMax/500)*100

          },
          gridLines: {
            display: false
          },
        }],
        xAxes: [{
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            gridLines: {
              display: false
            },
            ticks: {
              reverse: true,
              display: false
            }
        }]
      }
    };
    this.histogram = Chart.Bar('canvas', {
      data,
      options: option
    });
  }


}
