import { Subject } from 'rxjs'
import { Component, OnDestroy } from '@angular/core'

@Component({
  standalone: true,
  template: ''
})
export abstract class AppDestroy implements OnDestroy {
  destroy$ = new Subject<boolean>()

  ngOnDestroy() {
    this.destroy$.next(true)
    this.destroy$.unsubscribe()
  }
}
