import { Component, computed, inject, signal } from '@angular/core'
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ResumeExperienceMapped } from '../../app.type'
import { DataService } from '../../services/data.service'
import { ResumeTimelinePositionComponent } from './components/resume-timeline-position/resume-timeline-position.component'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-timeline',
  imports: [TranslateModule, NgStyle, NgClass, UpperCasePipe, ResumeTimelinePositionComponent],
  templateUrl: './resume-timeline.component.html',
  styleUrl: './resume-timeline.component.scss'
})
export class ResumeTimelineComponent {
  readonly showMore = signal(false)
  readonly EXPERIENCES_DISPLAYED = 4
  readonly displayedExperiences = computed(() => {
    const all = this.experiences()
    return this.showMore() ? all : all.slice(0, this.EXPERIENCES_DISPLAYED)
  })
  readonly remainingExperiencesCount = computed(() => {
    return Math.max(0, this.experiences().length - this.EXPERIENCES_DISPLAYED)
  })
  private readonly dataService = inject(DataService)
  readonly experiences = toSignal(this.dataService.getCombinedExperience(), {
    initialValue: [] as ResumeExperienceMapped[]
  })

  toggleShowMore() {
    this.showMore.update((value) => !value)
  }

  calculateDatePeriod(experience: ResumeExperienceMapped) {
    return this.dataService.calculateDatePeriod(experience)
  }

  computeNextPositionStyle(
    currentExperienceIndex: number,
    currentPositionIndex: number
  ): { [key: string]: string } {
    const nextExperienceIndex = currentExperienceIndex + 1
    const experiences = this.experiences()

    const hasNextExperience = nextExperienceIndex < experiences.length
    const isLastExperiencePosition =
      currentPositionIndex === experiences[currentExperienceIndex].positions.length - 1

    const nextCompanyStyle =
      hasNextExperience && isLastExperiencePosition
        ? experiences[nextExperienceIndex].company.style
        : experiences[currentExperienceIndex].company.style

    return {
      '--company-line-c-next': nextCompanyStyle?.['--company-line-c']
    }
  }
}
