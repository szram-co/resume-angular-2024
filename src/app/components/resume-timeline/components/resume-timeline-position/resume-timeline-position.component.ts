import { Component, Input, OnInit } from '@angular/core'
import { AppHoverClassDirective } from '../../../../directives/app-hover-class.directive'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { ResumePosition, ResumeTechnology } from '../../../../app.type'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { LanguageService } from '../../../../services/language.service'
import { AppDestroy } from '../../../../abstract/AppDestroy.abstract'

@Component({
  selector: 'app-resume-timeline-position',
  standalone: true,
  imports: [AppHoverClassDirective, NgForOf, NgClass, NgIf, TranslateModule, NgStyle],
  templateUrl: './resume-timeline-position.component.html',
  styleUrl: './resume-timeline-position.component.scss'
})
export class ResumeTimelinePositionComponent extends AppDestroy implements OnInit {
  @Input() position!: ResumePosition
  @Input() nextPositionStyle!: { [key: string]: string }

  shouldShowAllTechnologies = false

  readonly TECHNOLOGIES_DISPLAYED: number = 6

  constructor(
    private translate: TranslateService,
    private language: LanguageService
  ) {
    super()
  }

  ngOnInit() {}

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  translatedDate(date: string): string {
    if (date.toLowerCase() === 'present') return this.language.get('DATE.PRESENT')

    const dateObject = new Date(date)
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0')
    const year = dateObject.getFullYear()

    const monthTranslation = this.language.get(`MONTH.${month}`)

    // Get the first three letters of the translated month
    const monthShort = monthTranslation.substring(0, 3).toUpperCase()

    return `${monthShort} ${year}`
  }

  calculateTechnologies(technologies: ResumeTechnology[]) {
    if (this.shouldShowAllTechnologies) return technologies
    return technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  showAllTechnologies() {
    this.shouldShowAllTechnologies = true
  }
}
