import { Component, OnInit, Output, EventEmitter, ElementRef, Input, OnChanges } from '@angular/core';
import { IntersectionObserverService } from 'src/app/services/intersectionObserver';
import { InfoService } from 'src/app/services/infoService';
import { Router } from '@angular/router';
import { TokenService } from 'src/app/services/spotifyAuth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  providers: [IntersectionObserverService]

})
export class IntroComponent implements OnInit, OnChanges {
  @Input() data;
  @Input() error;

  constructor(
    public element: ElementRef,
    public intersectionObserverService: IntersectionObserverService,
    public infoSvc: InfoService,
    public router: Router,
    public tokenSvc: TokenService,
    public snkBar: MatSnackBar,
    public platform: Platform
    ) { }

  public userImage;
  public userName;
  public welcomeMessage;
  public greeting;

  ngOnChanges(change) {
    if (!change.data.previousValue && change.data.currentValue) {
      this.userName = this.checkName(this.data.display_name);
      this.userImage = this.data.images[0] ? this.data.images[0].url : null;
      this.welcomeMessage = this.getRandomWelcomeMessage();
      this.greeting = this.getRandomGreeting();
    }
  }

  ngOnInit() {
    if (this.error) {
      this.snkBar.open('No data. Try again later.', '' , {
        duration: 5000,
        panelClass: 'panel-error',
      verticalPosition: 'top'
    });
    }
  }

  public logout() {
    this.tokenSvc.clearToken();
    window.open('https://www.spotify.com/logout', '_blank');
    this.router.navigate(['login']);
  }

  private checkName(name) {
    if (name.split(' ').length >= 2) {
      return ' ' + name.split(' ')[0] + '.';
    } else {
      const nameArray = name.split('');
      nameArray.forEach(element => {
        if (Number(element)) {
          return '.';
        }
      });
    }
  }

  private getRandomGreeting() {
    const greetings = [
      'Hi',
      'Hey',
      'Hello'
    ];
    return greetings[Math.floor(Math.random() * Math.floor(greetings.length - 1))];
  }

  private getRandomWelcomeMessage() {
    const messages = [
      'Let\'s see how obscure your taste is...',
      'Check out your stats below',
      'Find out more about your music taste below'
    ];
    return messages[Math.floor(Math.random() * Math.floor(messages.length - 1))];
  }

}
