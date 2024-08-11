import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AppDestroy } from './abstract/AppDestroy.abstract'
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
export class AppComponent extends AppDestroy {
  constructor(private theme: ThemeService) {
    super()
    this.theme.themeInitialize()
  }
}
