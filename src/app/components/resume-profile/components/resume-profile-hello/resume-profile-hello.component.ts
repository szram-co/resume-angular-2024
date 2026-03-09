import { Component, computed, effect, ElementRef, inject, input, viewChild } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { ActivatedRoute } from '@angular/router'
import { ThemeService } from '../../../../services/theme.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-profile-hello',
  imports: [TranslateModule],
  templateUrl: './resume-profile-hello.component.html',
  styleUrl: './resume-profile-hello.component.scss'
})
export class ResumeProfileHelloComponent {
  readonly svgElement = viewChild<ElementRef<SVGElement>>('svgElement')
  readonly type = input<'path' | 'text'>('path')

  private readonly theme = inject(ThemeService)
  private readonly route = inject(ActivatedRoute)

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  })

  readonly currentLanguage = computed<'pl' | 'en'>(() => {
    const lang = this.routeParams().get('lang')
    return this.#resolveLanguage(lang)
  })

  private readonly gradientDark = [
    { offset: 0, color: '#28988E' },
    { offset: 0.2, color: '#5CD5CA' },
    { offset: 0.7, color: '#2FA99E' },
    { offset: 1, color: '#02605C' }
  ]
  private readonly gradientLight = [
    { offset: 0, color: '#02605C' },
    { offset: 0.2, color: '#28988E' },
    { offset: 0.7, color: '#2FA99E' },
    { offset: 1, color: '#5CD5CA' }
  ]
  private frameId: number | null = null

  constructor() {
    effect(() => {
      this.currentLanguage()
      this.type()
      this.#scheduleStrokesDashOffsetCalculation()
    })
  }

  get svgGradient() {
    return this.theme.isDark ? this.gradientDark : this.gradientLight
  }

  #resolveLanguage(lang: string | null): 'pl' | 'en' {
    return lang === 'en' ? 'en' : 'pl'
  }

  #scheduleStrokesDashOffsetCalculation() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }

    this.frameId = requestAnimationFrame(() => this.#calculateStrokesDashOffset())
  }

  #calculateStrokesDashOffset() {
    const svgNativeElement = this.svgElement()?.nativeElement

    if (!svgNativeElement) {
      return
    }

    const svgPaths = Array.from(svgNativeElement.querySelectorAll('path')) as SVGPathElement[]
    const batchSize = 30
    let index = 0

    const processBatch = () => {
      const end = Math.min(index + batchSize, svgPaths.length)

      while (index < end) {
        const path = svgPaths[index]
        const length = path.getTotalLength()
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        index += 1
      }

      if (index < svgPaths.length) {
        this.frameId = requestAnimationFrame(processBatch)
      } else {
        this.frameId = null
      }
    }

    processBatch()
  }
}
