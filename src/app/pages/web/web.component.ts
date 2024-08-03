import { Component, OnInit } from '@angular/core'
import { NgClass, NgIf } from '@angular/common'
import { ResumeHeaderComponent } from '../../components/resume-header/resume-header.component'
import { ResumeProfileComponent } from '../../components/resume-profile/resume-profile.component'
import { ResumeSkillsComponent } from '../../components/resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../../components/resume-timeline/resume-timeline.component'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'

@Component({
  selector: 'app-web',
  standalone: true,
  imports: [
    NgIf,
    ResumeHeaderComponent,
    ResumeProfileComponent,
    ResumeSkillsComponent,
    ResumeTimelineComponent,
    NgClass
  ],
  templateUrl: './web.component.html',
  styleUrl: './web.component.scss'
})
export class WebComponent extends AppDestroy implements OnInit {
  isReady = false

  ngOnInit() {
    this.isReady = true
  }
}
