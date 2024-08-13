import { Component, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle } from '@angular/common'
import { ResumeHeaderComponent } from '../../components/resume-header/resume-header.component'
import { ResumeProfileComponent } from '../../components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from '../../components/resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../../components/resume-timeline/resume-timeline.component'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { DomSanitizer, Meta, SafeHtml, Title } from '@angular/platform-browser'
import { environment } from '../../../environments/environment'
import { takeUntil } from 'rxjs'
import type { SimpleIcon } from 'simple-icons'
import {
  siAngular,
  siBootstrap,
  siDocker,
  siGit,
  siHtml5,
  siIos,
  siJasmine,
  siJavascript,
  siJira,
  siMaterialdesign,
  siNginx,
  siPhp,
  siPwa,
  siSass,
  siStencil,
  siStorybook,
  siTypescript,
  siVuedotjs,
  siWebcomponentsdotorg,
  siWebstorm,
  siYarn
} from 'simple-icons'

interface ResumeIcon extends SimpleIcon {
  html: SafeHtml
}

interface ResumeStackIcons {
  upper: ResumeIcon[]
  down: ResumeIcon[]
}

@Component({
  selector: 'app-web',
  standalone: true,
  imports: [
    NgIf,
    ResumeHeaderComponent,
    ResumeProfileComponent,
    ResumeSkillsComponent,
    ResumeTimelineComponent,
    NgClass,
    NgForOf,
    NgOptimizedImage,
    NgStyle
  ],
  templateUrl: './web.component.html',
  styleUrl: './web.component.scss'
})
export class WebComponent extends AppDestroy implements OnInit {
  browserLang!: string
  isReady = false

  stackIcons: ResumeStackIcons = {
    upper: [],
    down: []
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer
  ) {
    super()
    this.browserLang = this.translate.getBrowserLang() ?? 'pl'
  }

  get storageLang() {
    const lang = localStorage.getItem('LANG')
    return lang?.match(/en|pl/) ? lang : this.browserLang.match(/en|pl/) ? this.browserLang : 'pl'
  }

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const lang = params.get('lang')

      if (lang?.match(/en|pl/)) {
        this.translate.use(lang)
        localStorage.setItem('LANG', lang)
      } else {
        this.router.navigate([`/${this.storageLang}`])
      }

      this.updateSiteMeta()
      this.updateSiteLinks()

      this.isReady = true

      this.stackIcons = {
        upper: [
          siJavascript,
          siTypescript,
          siAngular,
          siVuedotjs,
          siWebstorm,
          siMaterialdesign,
          siBootstrap,
          siPhp,
          siSass,
          siPwa
        ].map((icon) => {
          return { ...icon, html: this.sanitizer.bypassSecurityTrustHtml(icon.svg) }
        }),
        down: [
          siStencil,
          siStorybook,
          siWebcomponentsdotorg,
          siHtml5,
          siJasmine,
          siYarn,
          siIos,
          siDocker,
          siNginx,
          siJira,
          siGit
        ].map((icon) => {
          return { ...icon, html: this.sanitizer.bypassSecurityTrustHtml(icon.svg) }
        })
      }
    })
  }

  private updateSiteMeta() {
    this.translate.get(['PAGE_TITLE', 'PAGE_DESCRIPTION']).subscribe((data: any) => {
      this.titleService.setTitle(data?.PAGE_TITLE)
      this.metaService.updateTag({ property: 'og:title', content: data?.PAGE_TITLE })
      this.metaService.updateTag({ name: 'description', content: data?.PAGE_DESCRIPTION })
      this.metaService.updateTag({ property: 'og:description', content: data?.PAGE_DESCRIPTION })
    })
  }

  private updateSiteLinks() {
    this.metaService.updateTag({
      property: 'og:image',
      content: `${environment.url}assets/images/szram-share-image-${this.currentLanguage}.png`
    })

    this.metaService.updateTag({
      property: 'og:url',
      content: `${environment.url}${this.currentLanguage}/`
    })
  }
}
