import { Component, inject } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { ResumeAbout, ResumeTechnologyMapped } from '../../app.type'
import { DataService } from '../../services/data.service'
import { forkJoin } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-skills',
  imports: [TranslateModule],
  templateUrl: './resume-skills.component.html',
  styleUrl: './resume-skills.component.scss'
})
export class ResumeSkillsComponent {
  private readonly dataService = inject(DataService)

  private readonly data = toSignal(
    forkJoin({
      about: this.dataService.getAbout(),
      technologies: this.dataService.getCombinedTechnologies()
    }),
    { initialValue: null }
  )

  get about(): ResumeAbout {
    return (
      this.data()?.about ?? {
        name: '',
        email: '',
        phone: '',
        links: []
      }
    )
  }

  get technologies(): ResumeTechnologyMapped[] {
    return this.data()?.technologies ?? []
  }
}
