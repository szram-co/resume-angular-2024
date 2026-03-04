import { Component, computed, HostListener, inject, signal } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgClass, NgStyle } from '@angular/common'
import { DataService } from '../../services/data.service'
import { ResumeThemeMode } from '../../app.type'
import { RouterLink } from '@angular/router'
import { ThemeService } from '../../services/theme.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-header',
  imports: [NgClass, NgStyle, TranslateModule, RouterLink],
  templateUrl: './resume-header.component.html',
  styleUrl: './resume-header.component.scss'
})
export class ResumeHeaderComponent {
  isScrolled = false
  readonly backgroundOpacity = signal(0.15)
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 1

    const scrollOpacityMin = 0.15
    const scrollOpacityMax = 0.75

    const scrollMin = 0
    const scrollMax = window.innerHeight * 0.75

    const scrollY = window.scrollY
    const opacityRange = scrollOpacityMax - scrollOpacityMin

    if (scrollY >= scrollMax) {
      this.backgroundOpacity.set(scrollOpacityMax)
    } else if (scrollY <= scrollMin) {
      this.backgroundOpacity.set(scrollOpacityMin)
    } else {
      this.backgroundOpacity.set(scrollOpacityMin + (scrollY / scrollMax) * opacityRange)
    }
  }

  getCurrentLanguage() {
    return this.translate.currentLang
  }

  themeToggle() {
    this.theme.themeToggle()
  }
}
