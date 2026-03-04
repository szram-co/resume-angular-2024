import { Component, inject, input, signal } from '@angular/core'
import { AppHoverClassDirective } from '../../../../directives/app-hover-class.directive'
import { NgClass, NgStyle } from '@angular/common'
import { ResumePosition, ResumeTechnology } from '../../../../app.type'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { DataService } from '../../../../services/data.service'

@Component({
  selector: 'app-resume-timeline-position',
  imports: [AppHoverClassDirective, NgClass, TranslateModule, NgStyle],
  templateUrl: './resume-timeline-position.component.html',
  styleUrl: './resume-timeline-position.component.scss'
})
export class ResumeTimelinePositionComponent {
  readonly position = input.required<ResumePosition>()
  readonly nextPositionStyle = input.required<{ [key: string]: string }>()
  readonly shouldShowAllTechnologies = signal(false)
  readonly TECHNOLOGIES_DISPLAYED = 6
  private readonly dataService = inject(DataService)
  private readonly translate = inject(TranslateService)

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  calculateTechnologies(technologies: ResumeTechnology[]) {
    if (this.shouldShowAllTechnologies()) return technologies
    return technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  showAllTechnologies() {
    this.shouldShowAllTechnologies.set(true)
  }

  translatedDate(date: string): string {
    return this.dataService.translatedDate(date)
  }
}
