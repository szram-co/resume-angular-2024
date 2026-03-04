import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AppDestroy } from './abstract/AppDestroy.abstract'
import { ThemeService } from './services/theme.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent extends AppDestroy {
  constructor(private theme: ThemeService) {
    super()
    this.theme.themeInitialize()
  }
}
