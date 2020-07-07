import { Component, OnInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Chart } from 'chart.js';
import * as pluginAnnotations from 'chartjs-plugin-annotation';

@Component({
  selector: 'app-obscurity-graph',
  templateUrl: './obscurity-graph.component.html',
  styleUrls: ['./obscurity-graph.component.scss']
})
export class ObscurityGraphComponent implements OnInit {
  @Input() data;

  constructor(private renderer: Renderer2, public el: ElementRef, public sanitizer: DomSanitizer) {

  }

  public histogram = [];

  ngOnInit() {
    const oldData = Object.entries(this.data.breakdown);
    const labels = [...oldData.map((val: any) => {
      if (Number(val[0]) >= 130  && val[0] <= 235) {

        return Number(val[0]);

      } else {
        return false;
      }
    })].filter((val) => {
      if (true) {
        return val;
      }
    });

    const dataSet = [...oldData.map((val: any) => {
      if (Number(val[0]) >= 130  && val[0] <= 235) {
        return Number(val[1].N);
      } else {
        return false;
      }
    })].filter((val) => {
      if (true) {
        return val;
      }
    });

    const userAllTimeAnnotation = {
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis-0',
      value: this.data.userAllTimeScore,
      borderColor: 'rgb(162, 158, 255)',
      borderWidth: 2,

      label: {
        fontColor: 'rgb(162, 158, 255)',
        content: `Your All Time ${Math.round(this.data.percentileByCountryAllTime)}%`,
        enabled: true,
        position: 'center',
        fontSize: 10,
        yAdjust: -40,
      }
    };

    const userRecentAnnotation = {
      type: 'line',
      mode: 'vertical',
      scaleID: 'x-axis-0',
      value: this.data.userRecentScore,
      borderColor: 'rgb(229, 202, 169)',
      borderWidth: 2,

      label: {
        fontColor: 'rgb(229, 202, 169)',
        content: `Your Recent ${Math.round(this.data.percentileByCountryRecent)}%`,
        enabled: true,
        position: 'center',
        yAdjust: -65,
        fontSize: 10

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
        annotations: [userAllTimeAnnotation, userRecentAnnotation]
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
            stepSize: 4000

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
