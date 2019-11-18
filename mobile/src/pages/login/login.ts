import { Component, Inject } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Deeplinks } from '@ionic-native/deeplinks';
import { HomePage } from '../home/home';
import { DomSanitizer, DOCUMENT } from '@angular/platform-browser';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  constructor(@Inject(DOCUMENT) public document: any, public navCtrl: NavController, public navParams: NavParams, private deeplinks: Deeplinks, public sanitizer: DomSanitizer) {

    this.deeplinks.routeWithNavController(this.navCtrl, {
        '/home/:token': HomePage
      }).subscribe((match) => {
          // match.$route - the route we matched, which is the matched entry from the arguments to route()
          // match.$args - the args passed in the link
          // match.$link - the full link data
          console.log('Successfully matched route', match);
        }, (nomatch) => {
          // nomatch.$link - the full link data
          console.error('Got a deeplink that didn\'t match', nomatch);
        });


  }

  //it's mobile_local_login or mobile_login for the button href

}
