import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable()
export class BrowserCheck {

    public isDevice;


    constructor(public platform: Platform) {
        if (window.screen.width < 1021) {
            this.isDevice = true;
        } else {
            this.isDevice = false;
        }
    }

    checkIfBrowser() {
        return this.platform.isBrowser;
    }
}

export default BrowserCheck;

