import { Component, OnInit, Output, EventEmitter, ElementRef, AfterViewInit, Input } from '@angular/core';
import { IntersectionObserverService } from 'src/app/services/intersectionObserver';
import { Subscription } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange } from '@angular/material/select';


@Component({
  selector: 'app-obscurity-rating',
  templateUrl: './obscurity-rating.component.html',
  styleUrls: ['./obscurity-rating.component.scss'],
  providers: [IntersectionObserverService]

})
export class ObscurityRatingComponent implements OnInit, AfterViewInit {
  @Input() data;
  @Output() switchCountryEvent: EventEmitter<string> = new EventEmitter<string>();

  constructor(public element: ElementRef, public intersectionObserverService: IntersectionObserverService) { }
  public show = false;
  private intersectionObserverSubs: Subscription;
  public countryList: any = [
    {value: 'US', viewValue: 'United States'},
    {value: 'AR', viewValue: 'Argentina'},
    {value: 'AU', viewValue: 'Australia'},
    {value: 'BR', viewValue: 'Brazil'},
    {value: 'CL', viewValue: 'Chile'},
    {value: 'DK', viewValue: 'Denmark'},
    {value: 'FI', viewValue: 'Finland'},
    {value: 'FR', viewValue: 'France'},
    {value: 'DE', viewValue: 'Germany'},
    {value: 'GB', viewValue: 'Great Britain'},
    {value: 'ID', viewValue: 'Indonesia'},
    {value: 'IE', viewValue: 'Ireland'},
    {value: 'IT', viewValue: 'Italy'},
    {value: 'MX', viewValue: 'Mexico'},
    {value: 'NL', viewValue: 'Netherlands'},
    {value: 'NZ', viewValue: 'New Zealand'},
    {value: 'NO', viewValue: 'Norway'},
    {value: 'PH', viewValue: 'Philippines'},
    {value: 'PL', viewValue: 'Poland'},
    {value: 'PT', viewValue: 'Portugal'},
    {value: 'ES', viewValue: 'Spain'},
    {value: 'SG', viewValue: 'Singapore'},
    {value: 'SE', viewValue: 'Sweden'},
    {value: 'TR', viewValue: 'Turkey'}
  ];

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.intersectionObserverService.init(this.element.nativeElement, {
      root: null,
      rootMargin: '0px',
      threshold: [0.20]
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

  switchCountry(code) {
    this.switchCountryEvent.emit(code);
  }
}
