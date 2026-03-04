import { Component, computed, inject, input } from '@angular/core'
import { ResumeTechnologyWithIcon } from '../../app.type'
import { map } from 'rxjs'
import { DataService } from '../../services/data.service'
import { NgClass, NgStyle } from '@angular/common'
import { ResumeTechnologyItemComponent } from './components/resume-technology-item/resume-technology-item.component'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-technologies',
  imports: [NgClass, ResumeTechnologyItemComponent, NgStyle],
  templateUrl: './resume-technologies.component.html',
  styleUrl: './resume-technologies.component.scss'
})
export class ResumeTechnologiesComponent {
  readonly rows = input<number>(3)

  private readonly dataService = inject(DataService)

  private readonly technologiesWithIcons = toSignal(
    this.dataService
      .getTechnologies()
      .pipe(
        map((technologies) =>
          technologies.filter(
            (tech): tech is ResumeTechnologyWithIcon =>
              'icon' in tech && typeof tech.icon === 'string'
          )
        )
      ),
    { initialValue: [] as ResumeTechnologyWithIcon[] }
  )

  readonly technologies = computed<ResumeTechnologyWithIcon[][]>(() => {
    const rows = Math.max(1, this.rows())
    return this.splitArrayIntoChunks(this.technologiesWithIcons(), rows)
  })

  private splitArrayIntoChunks(
    array: ResumeTechnologyWithIcon[],
    numChunks: number
  ): ResumeTechnologyWithIcon[][] {
    if (!array.length) {
      return []
    }

    const chunkSize = Math.ceil(array.length / numChunks)
    const chunks: ResumeTechnologyWithIcon[][] = []

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }

    return chunks
  }
}
