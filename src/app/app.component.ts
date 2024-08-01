import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { JsonPipe, NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle } from '@angular/common'
import { ResumeHeaderComponent } from './components/resume-header/resume-header.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeTimelineComponent } from './components/resume-timeline/resume-timeline.component'
import { ResumeProfileComponent } from './components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from './components/resume-skills/resume-skills.component'
import { takeUntil } from 'rxjs'
import { AppDestroy } from './abstract/AppDestroy.abstract'
import { ResumePdfComponent } from './components/resume-pdf/resume-pdf.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgForOf,
    NgIf,
    JsonPipe,
    ResumeHeaderComponent,
    NgOptimizedImage,
    NgStyle,
    NgClass,
    TranslateModule,
    ResumeProfileComponent,
    ResumeTimelineComponent,
    ResumeSkillsComponent,
    ResumePdfComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends AppDestroy implements OnInit {
  @ViewChild('pdfContainer', { read: ViewContainerRef }) pdfContainer!: ViewContainerRef

  isReady = false
  browserLang!: string

  constructor(private translate: TranslateService) {
    super()
    this.browserLang = this.translate.getBrowserLang() ?? 'en'

    translate.use(this.storageLang)
  }

  get storageLang() {
    const lang = localStorage.getItem('LANG')
    return lang?.match(/en|pl/) ? lang : this.browserLang.match(/en|pl/) ? this.browserLang : 'en'
  }

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe((language) => {
      if (language.lang !== this.storageLang) {
        localStorage.setItem('LANG', language.lang)
      }

      this.isReady = true
    })
  }
}
