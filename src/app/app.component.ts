import { Component, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AppDestroy } from './abstract/AppDestroy.abstract'
import { TranslateService } from '@ngx-translate/core'
import { takeUntil } from 'rxjs'
import { NgClass, NgIf } from '@angular/common'
import { ResumeHeaderComponent } from './components/resume-header/resume-header.component'
import { ResumeProfileComponent } from './components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from './components/resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from './components/resume-timeline/resume-timeline.component'
import { ThemeService } from './services/theme.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgClass,
    NgIf,
    ResumeHeaderComponent,
    ResumeProfileComponent,
    ResumeSkillsComponent,
    ResumeTimelineComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends AppDestroy implements OnInit {
  browserLang!: string

  constructor(
    private translate: TranslateService,
    private theme: ThemeService
  ) {
    super()
    this.theme.themeInitialize()
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
    })
  }
}
