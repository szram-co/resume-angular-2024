import { Component, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle, UpperCasePipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeExperienceMapped, ResumeTechnology } from '../../app.type'
import { DataService } from '../../services/data.service'
import { LanguageService } from '../../services/language.service'
import { AppHoverClassDirective } from '../../directives/app-hover-class.directive'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-timeline',
  standalone: true,
  imports: [
    NgForOf,
    TranslateModule,
    NgStyle,
    NgClass,
    NgOptimizedImage,
    UpperCasePipe,
    NgIf,
    AppHoverClassDirective
  ],
  templateUrl: './resume-timeline.component.html',
  styleUrl: './resume-timeline.component.scss'
})
export class ResumeTimelineComponent extends AppDestroy implements OnInit {
  experiences: ResumeExperienceMapped[] = []
  showMore: boolean = false

  readonly EXPERIENCES_DISPLAYED: number = 3
  readonly TECHNOLOGIES_DISPLAYED: number = 5

  constructor(
    private dataService: DataService,
    private translate: TranslateService,
    private language: LanguageService
  ) {
    super()
  }

  ngOnInit(): void {
    this.dataService
      .getCombinedExperience()
      .pipe(takeUntil(this.destroy$))
      .subscribe((experienceData: ResumeExperienceMapped[]) => {
        this.experiences = experienceData
      })
  }

  get displayedExperiences(): ResumeExperienceMapped[] {
    return this.showMore ? this.experiences : this.experiences.slice(0, this.EXPERIENCES_DISPLAYED)
  }

  get remainingExperiencesCount(): number {
    return this.experiences.length - this.EXPERIENCES_DISPLAYED
  }

  toggleShowMore() {
    this.showMore = !this.showMore
  }

  computeNextPositionStyle(
    currentExperienceIndex: number,
    currentPositionIndex: number
  ): { [key: string]: string } {
    const nextExperienceIndex = currentExperienceIndex + 1

    const hasNextExperience = nextExperienceIndex < this.experiences.length
    const isLastExperiencePosition =
      currentPositionIndex === this.experiences[currentExperienceIndex].positions.length - 1

    const nextCompanyStyle =
      hasNextExperience && isLastExperiencePosition
        ? this.experiences[nextExperienceIndex].company.style
        : this.experiences[currentExperienceIndex].company.style

    return {
      '--company-line-c-next': nextCompanyStyle?.['--company-line-c']
    }
  }

  calculateTechnologies(technologies: ResumeTechnology[]) {
    return technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  calculateDatePeriod(experience: ResumeExperienceMapped) {
    const from = experience.positions[experience.positions.length - 1].date.from
    const to = experience.positions[0].date.to

    const dateFrom = new Date(from)
    const dateTo = to.toLowerCase() === 'present' ? new Date() : new Date(to)

    const diff = dateTo.getTime() - dateFrom.getTime()
    const totalExperience = diff / (1000 * 3600 * 24 * 30.44)

    const totalYears = Math.floor(totalExperience / 12)
    const totalMonths = Math.round(totalExperience % 12)

    const chunks = []

    if (totalYears >= 1) chunks.push(this.language.plural('DATE.YEAR', totalYears))
    if (totalYears >= 1 && totalMonths >= 1) chunks.push(this.language.get('DATE.AND'))
    if (totalMonths >= 1) chunks.push(this.language.plural('DATE.MONTH', totalMonths))

    return chunks.join(' ')
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

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }
}
