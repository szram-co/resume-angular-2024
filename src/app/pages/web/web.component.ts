import { Component, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle } from '@angular/common'
import { ResumeHeaderComponent } from '../../components/resume-header/resume-header.component'
import { ResumeProfileComponent } from '../../components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from '../../components/resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../../components/resume-timeline/resume-timeline.component'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { DomSanitizer, Meta, Title } from '@angular/platform-browser'
import { environment } from '../../../environments/environment'
import { map, takeUntil } from 'rxjs'
import { DataService } from '../../services/data.service'
import {
  ResumeTechnologyMapped,
  ResumeTechnologySafeIcon,
  ResumeTechnologyWithIcon
} from '../../app.type'
import type { SimpleIcon } from 'simple-icons'
import * as SimpleIcons from 'simple-icons'

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

  technologies: ResumeTechnologyMapped[] = []
  stackIcons: Array<ResumeTechnologySafeIcon[]> = []

  readonly simpleIcons: { [key: string]: SimpleIcon } = SimpleIcons

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private titleService: Title,
    private metaService: Meta,
    private sanitizer: DomSanitizer,
    private dataService: DataService
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
    this.dataService
      .getTechnologies()
      .pipe(
        takeUntil(this.destroy$),
        map((technologies) =>
          technologies
            .filter(
              (tech): tech is ResumeTechnologyWithIcon =>
                'icon' in tech && typeof tech?.icon === 'string'
            )
            .map((tech) =>
              this.simpleIcons?.[tech.icon] ? (this.simpleIcons[tech.icon] as SimpleIcon) : null
            )
            .filter((icon): icon is SimpleIcon => icon !== null)
        )
      )
      .subscribe((icons) => {
        const totalItems = icons.length
        const itemsPerPart = Math.floor(totalItems / 3)
        const remainder = totalItems % 3

        const iconsRow1 = icons.slice(0, itemsPerPart + (remainder > 0 ? 1 : 0))
        const iconsRow2 = icons.slice(
          iconsRow1.length,
          iconsRow1.length + itemsPerPart + (remainder > 1 ? 1 : 0)
        )
        const iconsRow3 = icons.slice(iconsRow1.length + iconsRow2.length)

        this.stackIcons = [
          this.mapIconsWithSafe(iconsRow1),
          this.mapIconsWithSafe(iconsRow2),
          this.mapIconsWithSafe(iconsRow3)
        ]
      })

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

      // this.stackIcons = {
      //   upper: [
      //     // siJavascript,
      //     // siTypescript,
      //     // siAngular,
      //     // siVuedotjs,
      //     // siWebstorm,
      //     // siMaterialdesign,
      //     // siBootstrap,
      //     // siPhp,
      //     // siSass,
      //     siPwa
      //   ].map((icon) => {
      //     return { ...icon, html: this.sanitizer.bypassSecurityTrustHtml(icon.svg) }
      //   }),
      //   down: [
      //     // siStencil,
      //     // siStorybook,
      //     // siWebcomponentsdotorg,
      //     // siHtml5,
      //     // siJasmine,
      //     // siYarn,
      //     // siIos,
      //     // siDocker,
      //     // siNginx,
      //     // siJira,
      //     // siGit,
      //     // siApifox,
      //     siTestinglibrary
      //   ].map((icon) => {
      //     return { ...icon, html: this.sanitizer.bypassSecurityTrustHtml(icon.svg) }
      //   })
      // }
    })
  }

  private mapIconsWithSafe(icons: SimpleIcon[]) {
    return icons.map((icon): ResumeTechnologySafeIcon => {
      return { ...icon, html: this.sanitizer.bypassSecurityTrustHtml(icon.svg) }
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
