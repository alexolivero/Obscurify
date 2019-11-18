import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { MyMusicComponent } from './my-music/my-music';
import { MyRecsComponent } from './my-recs/my-recs';
import { ObscurityGraphComponent } from './obscurity-graph/obscurity-graph';
import { PercentileComponent } from './percentile/percentile';
import { MyMoodsComponent } from './my-moods/my-moods';
import { MyMoodsGraphComponent } from './my-moods-graph/my-moods-graph';
@NgModule({
	declarations: [
    ObscurityGraphComponent,
    MyMusicComponent,
    MyRecsComponent,
    PercentileComponent,
    MyMoodsGraphComponent,
    MyMoodsComponent
    ],
	imports: [
    IonicModule
  ],
	exports: [
    ObscurityGraphComponent,
    MyMusicComponent,
    MyRecsComponent,
    PercentileComponent,
    MyMoodsGraphComponent,
    MyMoodsComponent]
})
export class ComponentsModule {}
