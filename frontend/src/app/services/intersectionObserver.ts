import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class IntersectionObserverService {
    private intersectionObserverSubject = new Subject<any>();

    getSubject(): Subject<any> {
        return this.intersectionObserverSubject;
    }
    init(el: HTMLElement, options: object): void {
        const OBS = new IntersectionObserver(entries => {
            this.intersectionObserverSubject.next(entries[0]);
        }, options);

        OBS.observe(el);
    }

}


export default IntersectionObserverService;


