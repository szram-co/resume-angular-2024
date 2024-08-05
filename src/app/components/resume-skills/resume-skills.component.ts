import { Component, OnInit } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { JsonPipe, NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { ResumeAbout, ResumeTechnologyMapped } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { forkJoin, takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-skills',
  standalone: true,
  imports: [TranslateModule, NgForOf, JsonPipe, NgStyle, NgClass, NgIf],
  templateUrl: './resume-skills.component.html',
  styleUrl: './resume-skills.component.scss'
})
export class ResumeSkillsComponent extends AppDestroy implements OnInit {
  about!: ResumeAbout
  technologies: ResumeTechnologyMapped[] = []

  constructor(private dataService: DataService) {
    super()
  }

  ngOnInit() {
    forkJoin([this.dataService.getAbout(), this.dataService.getCombinedTechnologies()])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([aboutData, technologiesData]) => {
        this.about = aboutData
        this.technologies = technologiesData
      })
  }
}
