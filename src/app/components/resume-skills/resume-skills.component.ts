import { Component, OnInit } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { JsonPipe, NgForOf, NgStyle } from '@angular/common'
import { ResumeTechnologyMapped } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-skills',
  standalone: true,
  imports: [TranslateModule, NgForOf, JsonPipe, NgStyle],
  templateUrl: './resume-skills.component.html',
  styleUrl: './resume-skills.component.scss'
})
export class ResumeSkillsComponent extends AppDestroy implements OnInit {
  technologies: ResumeTechnologyMapped[] = []
  showMore: boolean = false

  private readonly TECHNOLOGIES_DISPLAYED = 15

  constructor(private dataService: DataService) {
    super()
  }

  ngOnInit() {
    this.dataService
      .getCombinedTechnologies()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.technologies = data
      })
  }

  get displayedTechnologies() {
    return this.showMore
      ? this.technologies
      : this.technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  get remainingTechnologiesCount(): number {
    return this.technologies.length - this.TECHNOLOGIES_DISPLAYED
  }

  toggleShowMore() {
    this.showMore = !this.showMore
  }
}
