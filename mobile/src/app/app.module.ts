import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Ng2TrackScrollModule } from 'ng2-track-scroll';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpClientModule } from '@angular/common/http';
import { MyApp } from './app.component';


import { AboutPage } from '../pages/about/about';
// import { MyMusicPage } from '../pages/my-music/my-music';
// import { MyRecsPage } from '../pages/my-recs/my-recs';
// import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { RestProvider } from '../providers/rest/rest';
import { Deeplinks } from '@ionic-native/deeplinks';

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    // MyMusicPage,
    // MyRecsPage,
    // HomePage,
    LoginPage,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    //TabsPageModule,
    Ng2TrackScrollModule.forRoot(),
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    // MyMusicPage,
    // MyRecsPage,
    LoginPage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    RestProvider,
    Deeplinks,
  ]
})
export class AppModule {}
