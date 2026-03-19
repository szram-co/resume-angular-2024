import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgClass } from '@angular/common'
import { DataService } from '../../services/data.service'
import { ResumeThemeMode } from '../../app.type'
import { RouterLink } from '@angular/router'
import { ThemeService } from '../../services/theme.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-header',
  imports: [NgClass, TranslateModule, RouterLink],
  templateUrl: './resume-header.component.html',
  styleUrl: './resume-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResumeHeaderComponent {
  private readonly theme = inject(ThemeService)
  private readonly translate = inject(TranslateService)
  private readonly dataService = inject(DataService)
  private readonly about = toSignal(this.dataService.getAbout(), { initialValue: null })
  readonly links = computed(() => this.about()?.links ?? [])
  readonly isReady = computed(() => this.about() !== null)

  get isThemeDark() {
    return this.theme.themeAttribute === ResumeThemeMode.DARK
  }

  get isThemeLight() {
    return this.theme.themeAttribute === ResumeThemeMode.LIGHT
  }

  getCurrentLanguage() {
    return this.translate.currentLang
  }

  themeToggle() {
    this.theme.themeToggle()
  }
}
