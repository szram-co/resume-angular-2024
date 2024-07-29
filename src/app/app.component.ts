import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { JsonPipe, NgClass, NgForOf, NgIf, NgOptimizedImage, NgStyle } from '@angular/common'
import { ResumeHeaderComponent } from './components/resume-header/resume-header.component'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeTimelineComponent } from './components/resume-timeline/resume-timeline.component'
import { ResumeProfileComponent } from './components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from './components/resume-skills/resume-skills.component'

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
    ResumeSkillsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    // translate.setDefaultLang('en')

    const browserLang = translate.getBrowserLang() ?? 'pl'

    console.warn('@browserLang', browserLang)
    translate.use(browserLang.match(/en|pl/) ? browserLang : 'en')
  }
}
