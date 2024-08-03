import { Component, HostListener, OnInit } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { DataService } from '../../services/data.service'
import { ResumeAboutLink, ResumeThemeMode } from '../../app.type'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'
import { RouterLink } from '@angular/router'
import { ThemeService } from '../../services/theme.service'

@Component({
  selector: 'app-resume-header',
  standalone: true,
  imports: [NgIf, NgClass, NgForOf, NgStyle, TranslateModule, RouterLink],
  templateUrl: './resume-header.component.html',
  styleUrl: './resume-header.component.scss'
})
export class ResumeHeaderComponent extends AppDestroy implements OnInit {
  links!: ResumeAboutLink[]
  isScrolled: boolean = false
  isReady = false

  backgroundOpacity: number = 0.15 // Default opacity

  constructor(
    private theme: ThemeService,
    private translate: TranslateService,
    private dataService: DataService
  ) {
    super()
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
      this.backgroundOpacity = scrollOpacityMax
    } else if (scrollY <= scrollMin) {
      this.backgroundOpacity = scrollOpacityMin
    } else {
      this.backgroundOpacity = scrollOpacityMin + (scrollY / scrollMax) * opacityRange
    }
  }

  ngOnInit() {
    this.dataService
      .getAbout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.links = data.links
        this.isReady = true
      })
  }

  changeLanguage(language: string) {
    this.translate.use(language)
  }

  getCurrentLanguage() {
    return this.translate.currentLang
  }

  get isThemeDark() {
    return this.theme.themeAttribute === ResumeThemeMode.DARK
  }

  get isThemeLight() {
    return this.theme.themeAttribute === ResumeThemeMode.LIGHT
  }

  themeToggle() {
    this.theme.themeToggle()
  }
}
