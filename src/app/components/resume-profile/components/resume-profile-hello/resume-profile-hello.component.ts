import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { AppDestroy } from '../../../../abstract/AppDestroy.abstract'
import { NgForOf, NgIf } from '@angular/common'
import { ActivatedRoute } from '@angular/router'
import { ThemeService } from '../../../../services/theme.service'

@Component({
  selector: 'app-resume-profile-hello',
  standalone: true,
  imports: [NgIf, TranslateModule, NgForOf],
  templateUrl: './resume-profile-hello.component.html',
  styleUrl: './resume-profile-hello.component.scss'
})
export class ResumeProfileHelloComponent extends AppDestroy implements OnInit {
  @ViewChild('svgElement', { static: true }) svgElement!: ElementRef<SVGElement>
  @Input() type: 'path' | 'text' = 'path'

  currentLanguage!: 'pl' | 'en'

  constructor(
    private theme: ThemeService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    super()
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.currentLanguage = params.get('lang') as 'pl' | 'en'

      this.cdr.detectChanges()
      this.calculateStrokesDashOffset()
    })
  }

  get svgGradient() {
    return this.theme.isDark
      ? [
          { offset: 0, color: '#28988E' },
          { offset: 0.2, color: '#5CD5CA' },
          { offset: 0.7, color: '#2FA99E' },
          { offset: 1, color: '#02605C' }
        ]
      : [
          { offset: 0, color: '#02605C' },
          { offset: 0.2, color: '#28988E' },
          { offset: 0.7, color: '#2FA99E' },
          { offset: 1, color: '#5CD5CA' }
        ]
  }

  private calculateStrokesDashOffset() {
    const svgPaths = this.svgElement.nativeElement.querySelectorAll('path')

    svgPaths?.forEach((path: SVGPathElement) => {
      const length = path.getTotalLength()
      path.style.strokeDasharray = `${length}`
      path.style.strokeDashoffset = `${length}`
    })
  }
}
