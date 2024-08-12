import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { AppDestroy } from '../../../../abstract/AppDestroy.abstract'
import { NgIf } from '@angular/common'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'app-resume-profile-hello',
  standalone: true,
  imports: [NgIf, TranslateModule],
  templateUrl: './resume-profile-hello.component.html',
  styleUrl: './resume-profile-hello.component.scss'
})
export class ResumeProfileHelloComponent extends AppDestroy implements OnInit {
  @ViewChild('svgElement', { static: true }) svgElement!: ElementRef<SVGElement>

  @Input() type: 'path' | 'text' = 'path'

  currentLanguage!: 'pl' | 'en'

  constructor(
    private translate: TranslateService,
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

  private calculateStrokesDashOffset() {
    const svgPaths = this.svgElement.nativeElement.querySelectorAll('path')

    svgPaths?.forEach((path: SVGPathElement) => {
      const length = path.getTotalLength()
      path.style.strokeDasharray = `${length}`
      path.style.strokeDashoffset = `${length}`
    })
  }
}
