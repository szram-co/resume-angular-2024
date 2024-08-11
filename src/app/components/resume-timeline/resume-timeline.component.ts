import { Component, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle, UpperCasePipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeExperienceMapped } from '../../app.type'
import { DataService } from '../../services/data.service'
import { LanguageService } from '../../services/language.service'
import { AppHoverClassDirective } from '../../directives/app-hover-class.directive'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'
import { ResumeTimelinePositionComponent } from './components/resume-timeline-position/resume-timeline-position.component'

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
    AppHoverClassDirective,
    ResumeTimelinePositionComponent
  ],
  templateUrl: './resume-timeline.component.html',
  styleUrl: './resume-timeline.component.scss'
})
export class ResumeTimelineComponent extends AppDestroy implements OnInit {
  experiences: ResumeExperienceMapped[] = []
  showMore: boolean = false

  readonly EXPERIENCES_DISPLAYED: number = 4

  calculateDatePeriod = this.dataService.calculateDatePeriod

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
}
