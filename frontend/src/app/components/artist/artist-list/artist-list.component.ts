import { Component, OnInit, Output, EventEmitter, ElementRef, AfterViewInit, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IntersectionObserverService } from 'src/app/services/intersectionObserver';
import { Subscription } from 'rxjs';
import { InfoService } from 'src/app/services/infoService';
import { TokenService } from 'src/app/services/spotifyAuth';
import { SpotifyService } from 'src/app/services/spotifyService';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ArtistNavComponent } from '../artist-nav/artist-nav.component';
import { BrowserCheck } from 'src/app/services/browserCheck';

@Component({
  selector: 'app-artist-list',
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss'],
  providers: [IntersectionObserverService]
})
export class ArtistListComponent implements AfterViewInit, OnInit, OnChanges {

  @Input() data: any;
  @Output() appColor = new EventEmitter<number>();

  @ViewChild('sentinelTop') sentinelTop;
  @ViewChild('sentinelBottom') sentinelBottom;
  @ViewChild('slate') slate;
  constructor(
    public element: ElementRef,
    public intersectionObserverService: IntersectionObserverService,
    public infoSvc: InfoService,
    public tokenSvc: TokenService,
    public spotifyService: SpotifyService,
    public snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet,
    private browserCheck: BrowserCheck) { }

  public navState;
  public selectedArtistsFromHistory;
  public selectedTracksFromHistory;

  public userInfo;

  public sliceLimit = 12;

  public showNav = false;
  public stickHeader = false;

  private componentIntersectObserverSub: Subscription;
  private sentinelTopIntersectSub: Subscription;
  private sentinelBottomIntersectSub: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data.currentValue.userHistory) {

      const historyList = [];

      changes.data.currentValue.userHistory.forEach((item, index) => {
        const historyItem = {
          name: item.formattedDate,
          value: index
        };
        historyList.push(historyItem);
      });
      const newState = {...this.navState };
      newState.historyList = [...this.navState.historyList, ...historyList];
      this.navState = { ...newState };
    }
  }

  ngOnInit() {
    this.userInfo = this.data.userInfo;
    if (!this.browserCheck.isDevice) {
      this.showNav = true;
    }

    const historyList = [];

    if (this.data.currentArtists.length > 0) {
      historyList.push({name: 'Current', value: 'current'});
    }
    if (this.data.allTimeArtists.length > 0) {
      historyList.push({name: 'All Time', value: 'allTime'});
    }



    this.navState = {
      listType: 'artists',
      historyList: [
        ...historyList
      ],
      selectedHistory: historyList[0]
    };

  }

  ngAfterViewInit(): void {
    if (this.browserCheck.isDevice) {
      this.intersectionObserverService.init(this.sentinelTop.nativeElement,
        {
          threshold: [0]
        });

      this.intersectionObserverService.init(this.sentinelBottom.nativeElement,
        {
          threshold: [1]
        });
    }

    this.componentIntersectObserverSub = this.intersectionObserverService
      .getSubject()
      .subscribe(el => {
        const targetInfo = el.boundingClientRect;
        const rootBoundsInfo = el.rootBounds;
        const ratio = el.intersectionRatio;

              // Started sticking.
        if (el.target.classList[1] === 'sticky_sentinel--top') {
          if (targetInfo.bottom < rootBoundsInfo.top) {
            this.stickHeader = true;
          }
          // Stopped sticking.
          if (targetInfo.bottom >= rootBoundsInfo.top &&
            targetInfo.bottom < rootBoundsInfo.bottom) {
                this.stickHeader = false;
          }
        }

        if (el.target.classList[1] === 'sticky_sentinel--bottom') {
          if (targetInfo.bottom > rootBoundsInfo.top && ratio === 1) {
            this.stickHeader = true;
          }

          // Stopped sticking.
          if (targetInfo.top < rootBoundsInfo.top &&
            targetInfo.bottom < rootBoundsInfo.bottom) {
                this.stickHeader = false;
          }
        }
      });
  }

  openBottomSheet() {
    const bottomsheetRef = this.bottomSheet.open(ArtistNavComponent, {
      panelClass: 'bottom-sheet__artist__nav',
      data: {
        navState: this.navState
      }});
    bottomsheetRef.instance.updateHistory.subscribe((res) => {
      this.getHistory(res);
    });
    bottomsheetRef.instance.createPlaylist.subscribe((res)=> {
      this.createPlaylist();
    });

    bottomsheetRef.instance.dismissBottomSheet.subscribe((res)=> {
      bottomsheetRef.dismiss();
    });
  }

  getHistory(data) {

    if (data.selectedHistory.value !== 'current' && data.selectedHistory.value !== 'allTime') {
      this.spotifyService.getArtists({artistIDs: this.data.userHistory[data.selectedHistory.value].shortTermArtistIDs})
        .then((res: any) => {
          this.selectedArtistsFromHistory = [...res.artists];
          this.navState = {...data};
        })
        .catch(err => {
          this.snackBar.open('Server Error. Could not get history', '' , {
            duration: 5000,
            panelClass: 'panel-error',
            verticalPosition: 'top'
          });
        });
      this.spotifyService.getTracks({trackIDs: this.data.userHistory[data.selectedHistory.value].shortTermTrackIDs})
      .then((res: any) => {
        this.selectedTracksFromHistory = [...res.tracks];
        this.navState = {...data};

      })
      .catch(err => {
        this.snackBar.open('Server Error. Could not get history', '' , {
          duration: 5000,
          panelClass: 'panel-error',
          verticalPosition: 'top'
        });
      });
    } else {
      this.navState = {...data};
    }
  }

  createPlaylist() {
    let playlistName = '';

    if (this.navState.selectedHistory.name === 'Current') {
      playlistName = 'Current';
    } else {
      playlistName = `${this.navState.selectedHistory.name} // Obscurify`;
    }

    if (playlistName === 'Current') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const dateObj = new Date();
      const month = monthNames[dateObj.getMonth()]; // months from 1-12
      const day = dateObj.getDate();
      const year = dateObj.getFullYear() % 100;
      const newdate = month + ' ' + day + ' \'' + year;
      playlistName = newdate + ' // Obscurify';
    }

    const config = {
      userID: this.data.userInfo.id,
      token: this.tokenSvc.oAuthToken,
      playlistName: (playlistName),
      tracks: null
    };

    if (this.navState.selectedHistory.value === 'current') {
      config.tracks = this.data.currentTracks;
    } else {
      config.tracks = this.data.allTimeTracks;
    }

    this.spotifyService.makePlaylist(config).then((results: any) => {
      this.snackBar.open('Playlist Created in Spotify!', '' , { duration: 5000, panelClass: 'panel-success', verticalPosition: 'top'});

    }).catch((err: any) => {
      this.snackBar.open('Server Error. Please Try Again Later.', '' , {
        duration: 5000,
        panelClass: 'panel-error',
        verticalPosition: 'top'
      });
    });
  }

  showMore() {
    this.sliceLimit = 50;
  }
  showLess() {
    this.sliceLimit = 12;
  }
}
