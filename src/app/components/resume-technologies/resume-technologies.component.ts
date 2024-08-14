import { Component, Input, OnInit } from '@angular/core'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { ResumeTechnologyWithIcon } from '../../app.type'
import { map, takeUntil } from 'rxjs'
import { DataService } from '../../services/data.service'
import { JsonPipe, NgClass, NgForOf, NgStyle } from '@angular/common'
import { ResumeTechnologyItemComponent } from './components/resume-technology-item/resume-technology-item.component'

@Component({
  selector: 'app-resume-technologies',
  standalone: true,
  imports: [NgForOf, NgClass, JsonPipe, ResumeTechnologyItemComponent, NgStyle],
  templateUrl: './resume-technologies.component.html',
  styleUrl: './resume-technologies.component.scss'
})
export class ResumeTechnologiesComponent extends AppDestroy implements OnInit {
  @Input() rows: number = 3

  technologies: Array<ResumeTechnologyWithIcon[]> = []

  constructor(private dataService: DataService) {
    super()
  }

  ngOnInit() {
    this.dataService
      .getTechnologies()
      .pipe(
        takeUntil(this.destroy$),
        map((technologies) =>
          technologies.filter(
            (tech): tech is ResumeTechnologyWithIcon =>
              'icon' in tech && typeof tech?.icon === 'string'
          )
        )
      )
      .subscribe((icons) => {
        this.technologies = this.splitArrayIntoChunks(icons, this.rows)
      })
  }

  private splitArrayIntoChunks<T>(array: T[], numChunks: number) {
    return array.reduce(
      (acc, item, index) => {
        const chunkIndex = Math.floor(index / Math.ceil(array.length / numChunks))
        if (!acc[chunkIndex]) {
          acc[chunkIndex] = []
        }
        acc[chunkIndex].push(item)
        return acc
      },
      [] as Array<T[]>
    )
  }
}
