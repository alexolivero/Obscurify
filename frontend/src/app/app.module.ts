import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlatformModule } from '@angular/cdk/platform';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { IntroComponent } from './components/intro/intro.component';
import { TopGenresComponent } from './components/top-genres/top-genres.component';
import { ObscurityRatingComponent } from './components/obscurity-rating/obscurity-rating.component';
import { ObscurityGraphComponent } from './components/obscurity-graph/obscurity-graph.component';
import { ArtistListComponent } from './components/artist/artist-list/artist-list.component';
import { ArtistCardComponent } from './components/artist/artist-card/artist-card.component';
import { ArtistNavComponent } from './components/artist/artist-nav/artist-nav.component';
import { MoodsGraphComponent } from './components/moods-graph/moods-graph.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService, TokenService, AuthGuard, SpotifyAuthInterceptor } from './services/spotifyAuth';
import { SpotifyAuthComponent } from './components/spotify-auth/spotify-auth.component';
import { InfoService } from './services/infoService';
import { ObscurityFuncs } from './utilities/obscurityFuncs';
import { TrackCardComponent } from './components/artist/track-card/track-card.component';
import { SpotifyService } from './services/spotifyService';
import { AboutComponent } from './components/about/about.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { FooterComponent } from './components/footer/footer.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ObscurifyService } from './services/obscurifyService';
import { BrowserCheck } from './services/browserCheck';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    IntroComponent,
    TopGenresComponent,
    ObscurityRatingComponent,
    ObscurityGraphComponent,
    ArtistListComponent,
    ArtistCardComponent,
    ArtistNavComponent,
    MoodsGraphComponent,
    RecommendationsComponent,
    LoginComponent,
    SpotifyAuthComponent,
    TrackCardComponent,
    AboutComponent,
    PrivacyComponent,
    FooterComponent,
  ],
  imports: [
    FlexLayoutModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    PlatformModule,
    MatRadioModule,
    MatSnackBarModule,
    MatSelectModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    MatMenuModule,
    MatProgressBarModule,
    MatBottomSheetModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    ObscurityFuncs,
    AuthService,
    TokenService,
    AuthGuard,
    InfoService,
    ObscurifyService,
    SpotifyService,
    BrowserCheck,
    [{
      provide:  HTTP_INTERCEPTORS,
      // Force interception to use your new shiny headers!
      useClass:  SpotifyAuthInterceptor,
      multi:  true
    }]],
  bootstrap: [AppComponent]
})
export class AppModule { }
