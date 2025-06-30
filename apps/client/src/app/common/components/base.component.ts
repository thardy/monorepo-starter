import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';

@Component({
  template: '',
})
export class BaseComponent implements OnDestroy {
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}