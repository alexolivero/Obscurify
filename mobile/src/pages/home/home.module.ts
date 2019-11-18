import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';
import { ComponentsModule } from '../../components/components.module';
@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(HomePage),
  ],
  entryComponents: [
    HomePage
  ]
})
export class HomePageModule {}
