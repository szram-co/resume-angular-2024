import { Component, Input, OnInit } from '@angular/core'
import { AppHoverClassDirective } from '../../../../directives/app-hover-class.directive'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { ResumePosition, ResumeTechnology } from '../../../../app.type'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { LanguageService } from '../../../../services/language.service'
import { AppDestroy } from '../../../../abstract/AppDestroy.abstract'
import { DataService } from '../../../../services/data.service'

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

  translatedDate = this.dataService.translatedDate

  constructor(
    private dataService: DataService,
    private translate: TranslateService,
    private language: LanguageService
  ) {
    super()
  }

  ngOnInit() {}

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  calculateTechnologies(technologies: ResumeTechnology[]) {
    if (this.shouldShowAllTechnologies) return technologies
    return technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  showAllTechnologies() {
    this.shouldShowAllTechnologies = true
  }
}
