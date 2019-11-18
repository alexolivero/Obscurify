import { Component, Input } from '@angular/core';

/**
 * Generated class for the PercentileComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'percentile',
  templateUrl: 'percentile.html'
})
export class PercentileComponent {
  @Input() data: any;
  text: string;

  constructor() {

  }

}
