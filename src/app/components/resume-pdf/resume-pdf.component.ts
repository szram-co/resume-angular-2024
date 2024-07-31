import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { HTMLFontFace, jsPDF } from 'jspdf'
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component'
import { NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ResumePDFFontFace } from '../../app.type'
import { ResumeSkillsComponent } from '../resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../resume-timeline/resume-timeline.component'

@Component({
  selector: 'app-resume-pdf',
  standalone: true,
  imports: [
    ResumeProfileComponent,
    NgStyle,
    NgForOf,
    NgIf,
    TranslateModule,
    ResumeSkillsComponent,
    ResumeTimelineComponent
  ],
  templateUrl: './resume-pdf.component.html',
  styleUrl: './resume-pdf.component.scss'
})
export class ResumePdfComponent extends AppDestroy implements AfterViewInit {
  @ViewChild('content', { static: false }) content!: ElementRef<HTMLDivElement>

  @Input() filename: string = 'resume.pdf'
  @Input() width: number = 1420

  private readonly pageMargin: number = 80
  private readonly pageAspectRatio: number = 1.414

  readonly pageWidth = this.width + this.pageMargin * 2
  readonly pageHeight = this.pageWidth * this.pageAspectRatio

  contentElement!: HTMLDivElement
  pdf!: jsPDF

  constructor() {
    super()
  }

  ngAfterViewInit() {
    this.contentElement = this.content.nativeElement
  }

  async downloadPDF() {
    this.pdf = new jsPDF('portrait', 'px', [this.pageWidth, this.pageHeight], true)
    this.pdf.setFontSize(16)

    this.pdf.html(this.contentElement, {
      fontFaces: this.fontFaces,
      x: this.pageMargin,
      y: 0,
      callback: (doc) => {
        doc.save(this.filename)
      }
    })
  }

  get fontFaces(): HTMLFontFace[] {
    const addFontFace = (font: ResumePDFFontFace) => {
      return font.src.map((src) => {
        return {
          src: [
            {
              url: `${font.url}${src.font}`,
              format: src?.format ?? 'truetype'
            }
          ],
          family: font.family,
          style: src?.style ?? 'normal',
          weight: src.weight
        } as HTMLFontFace
      })
    }

    return [
      // Mulish
      ...addFontFace({
        family: 'Mulish',
        url: '/assets/fonts/Mulish/static/',
        src: [
          { font: 'Mulish-Black.ttf', weight: 900 },
          { font: 'Mulish-ExtraBold.ttf', weight: 800 },
          { font: 'Mulish-Bold.ttf', weight: 700 },
          { font: 'Mulish-SemiBold.ttf', weight: 600 },
          { font: 'Mulish-Medium.ttf', weight: 500 },
          { font: 'Mulish-Regular.ttf', weight: 400 }
        ]
      }),
      // Saira Semi Condensed
      ...addFontFace({
        family: 'Saira Semi Condensed',
        url: '/assets/fonts/SairaSemiCondensed/',
        src: [
          { font: 'SairaSemiCondensed-Bold.ttf', weight: 700 },
          { font: 'SairaSemiCondensed-Medium.ttf', weight: 500 }
        ]
      }),
      // Poppins
      ...addFontFace({
        family: 'Poppins',
        url: '/assets/fonts/Poppins/',
        src: [
          { font: 'Poppins-Black.ttf', weight: 900 },
          { font: 'Poppins-BlackItalic.ttf', weight: 900, style: 'italic' },
          { font: 'Poppins-ExtraBold.ttf', weight: 800 },
          { font: 'Poppins-ExtraBoldItalic.ttf', weight: 800, style: 'italic' },
          { font: 'Poppins-Bold.ttf', weight: 700 },
          { font: 'Poppins-BoldItalic.ttf', weight: 700, style: 'italic' },
          { font: 'Poppins-Medium.ttf', weight: 500 },
          { font: 'Poppins-MediumItalic.ttf', weight: 500, style: 'italic' },
          { font: 'Poppins-Regular.ttf', weight: 400 },
          { font: 'Poppins-Italic.ttf', weight: 400, style: 'italic' }
        ]
      })
    ]
  }
}
