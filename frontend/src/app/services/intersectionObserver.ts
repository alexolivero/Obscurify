import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable()
export class IntersectionObserverService {

    constructor(public platform: Platform) {}

    private intersectionObserverSubject = new Subject<any>();

    getSubject(): Subject<any> {
        return this.intersectionObserverSubject;
    }
    init(el: HTMLElement, options: object): void {
        if (this.platform.isBrowser) {
          // Check if platform is running on client not server to call Browser API
          const OBS = new IntersectionObserver(entries => {
            this.intersectionObserverSubject.next(entries[0]);
          }, options);

          OBS.observe(el);
        }

    }

}


export default IntersectionObserverService;


