import { Component, OnInit, ElementRef, AfterViewInit, Input } from '@angular/core';
import { IntersectionObserverService } from 'src/app/services/intersectionObserver';
import { Subscription } from 'rxjs';
import { InfoService } from 'src/app/services/infoService';
import { ObscurityFuncs } from 'src/app/utilities/obscurityFuncs';

@Component({
  selector: 'app-top-genres',
  templateUrl: './top-genres.component.html',
  styleUrls: ['./top-genres.component.scss'],
  providers: [IntersectionObserverService]

})
export class TopGenresComponent implements OnInit, AfterViewInit {

  @Input() data: any;

  constructor(
    public element: ElementRef,
    public intersectionObserverService: IntersectionObserverService,
    public infoSvc: InfoService,
    private obscurifyFunc: ObscurityFuncs
    ) { }
  public items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  public show = false;

  public topGenres = [];
  private intersectionObserverSubs: Subscription;

  ngOnInit() {
    const genres: any = {};
    const topGenres: any = [];

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.data.allTimeArtists.length; i++) {
      // tslint:disable-next-line: prefer-for-of
      for (let y = 0; y < this.data.allTimeArtists[i].genres.length; y++) {
        if (genres[this.data.allTimeArtists[i].genres[y]] != null) {
        genres[this.data.allTimeArtists[i].genres[y]] = genres[this.data.allTimeArtists[i].genres[y]] + 1;
      } else {
        genres[this.data.allTimeArtists[i].genres[y]] = 1;
        }
      }

    }
    for (const g in genres) {
      if (genres.hasOwnProperty(g) && genres[g] > 4) {
        topGenres.push([g, genres[g]]);
      }
    }
    topGenres.sort(this.obscurifyFunc.comparator);
    this.topGenres = [...topGenres.slice(0, 10)];
  }


  ngAfterViewInit(): void {
    this.intersectionObserverService.init(this.element.nativeElement, {
      threshold: [0.20]
    });
    this.intersectionObserverSubs = this.intersectionObserverService
    .getSubject()
    .subscribe(el => {

      if (el.isIntersecting) {
        this.show = true;
      }
    });
  }

}
