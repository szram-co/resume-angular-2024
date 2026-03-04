import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'
import { ResumeHeaderComponent } from '../../components/resume-header/resume-header.component'
import { ResumeProfileComponent } from '../../components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from '../../components/resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../../components/resume-timeline/resume-timeline.component'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Meta, Title } from '@angular/platform-browser'
import { environment } from '../../../environments/environment'
import { ResumeTechnologiesComponent } from '../../components/resume-technologies/resume-technologies.component'
import { toSignal } from '@angular/core/rxjs-interop'
import { firstValueFrom } from 'rxjs'

@Component({
  selector: 'app-web',
  imports: [
    ResumeHeaderComponent,
    ResumeProfileComponent,
    ResumeSkillsComponent,
    ResumeTimelineComponent,
    NgClass,
    NgStyle,
    ResumeTechnologiesComponent
  ],
  templateUrl: './web.component.html',
  styleUrl: './web.component.scss'
})
export class WebComponent {
  readonly isReady = signal(false)
  readonly currentLanguage = signal<'pl' | 'en'>('pl')
  readonly isLanguageSwitching = signal(false)
  readonly languageWrapperMinHeight = signal<number | null>(null)
  readonly webRoot = viewChild<ElementRef<HTMLDivElement>>('webRoot')
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService)
  browserLang = this.translate.getBrowserLang() ?? 'pl'
  private readonly titleService = inject(Title)
  private readonly metaService = inject(Meta)
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  })
  private readonly pageMeta = toSignal(this.translate.stream(['PAGE_TITLE', 'PAGE_DESCRIPTION']), {
    initialValue: {
      PAGE_TITLE: '',
      PAGE_DESCRIPTION: ''
    } as Record<string, string>
  })
  private languageSwitchInProgress = false
  private pendingLanguage: 'pl' | 'en' | null = null
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor() {
    effect(() => {
      const lang = this.routeParams().get('lang')

      if (lang?.match(/en|pl/)) {
        void this.switchLanguage(lang as 'pl' | 'en')
      } else {
        this.router.navigate([`/${this.storageLang}`])
      }
    })

    effect(() => {
      const meta = this.pageMeta()
      const language = this.currentLanguage()

      if (!meta['PAGE_TITLE'] || !meta['PAGE_DESCRIPTION']) {
        return
      }

      this.titleService.setTitle(meta['PAGE_TITLE'])
      this.metaService.updateTag({ property: 'og:title', content: meta['PAGE_TITLE'] })
      this.metaService.updateTag({ name: 'description', content: meta['PAGE_DESCRIPTION'] })
      this.metaService.updateTag({ property: 'og:description', content: meta['PAGE_DESCRIPTION'] })

      this.metaService.updateTag({
        property: 'og:image',
        content: `${environment.url}assets/images/szram-share-image-${language}.png`
      })

      this.metaService.updateTag({
        property: 'og:url',
        content: `${environment.url}${language}/`
      })
    })
  }

  get storageLang() {
    const lang = localStorage.getItem('LANG')
    return lang?.match(/en|pl/) ? lang : this.browserLang.match(/en|pl/) ? this.browserLang : 'pl'
  }

  private async switchLanguage(lang: 'pl' | 'en') {
    if (this.languageSwitchInProgress) {
      this.pendingLanguage = lang
      return
    }

    if (this.currentLanguage() === lang && this.translate.currentLang === lang) {
      this.isReady.set(true)
      return
    }

    this.languageSwitchInProgress = true
    this.pendingLanguage = null

    const rootElement = this.webRoot()?.nativeElement
    const previousHeight = rootElement?.offsetHeight ?? null

    if (previousHeight) {
      this.languageWrapperMinHeight.set(previousHeight)
    }

    this.isLanguageSwitching.set(true)

    const applyLanguage = async () => {
      await firstValueFrom(this.translate.use(lang))
      localStorage.setItem('LANG', lang)
      this.currentLanguage.set(lang)
      this.isReady.set(true)
    }

    const documentWithTransition = document as Document & {
      startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void> }
    }

    try {
      if (documentWithTransition.startViewTransition && !this.prefersReducedMotion) {
        await documentWithTransition.startViewTransition(applyLanguage).finished
      } else {
        await applyLanguage()
      }
    } finally {
      requestAnimationFrame(() => {
        this.isLanguageSwitching.set(false)
        this.languageWrapperMinHeight.set(null)
      })
      this.languageSwitchInProgress = false

      if (this.pendingLanguage && this.pendingLanguage !== lang) {
        const nextLanguage = this.pendingLanguage
        this.pendingLanguage = null
        void this.switchLanguage(nextLanguage)
      }
    }
  }
}
