import { Component, inject, input } from '@angular/core'
import { AppHoverClassDirective } from '../../../../directives/app-hover-class.directive'
import { NgClass, NgStyle } from '@angular/common'
import { ResumePosition } from '../../../../app.type'
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
  private readonly dataService = inject(DataService)
  private readonly translate = inject(TranslateService)

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  translatedDate(date: string): string {
    return this.dataService.translatedDate(date)
  }
}
