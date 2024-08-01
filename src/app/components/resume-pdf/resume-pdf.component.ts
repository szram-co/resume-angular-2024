import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { HTMLFontFace, jsPDF } from 'jspdf'
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component'
import { JsonPipe, NgClass, NgForOf, NgIf, NgStyle, UpperCasePipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  ResumeAbout,
  ResumeExperienceMapped,
  ResumePDFFontFace,
  ResumeTechnology,
  ResumeTechnologyMapped
} from '../../app.type'
import { ResumeSkillsComponent } from '../resume-skills/resume-skills.component'
import { ResumeTimelineComponent } from '../resume-timeline/resume-timeline.component'
import { Router } from '@angular/router'
import { forkJoin, map, switchMap, takeUntil } from 'rxjs'
import { DataService } from '../../services/data.service'
import { AppHoverClassDirective } from '../../directives/app-hover-class.directive'
import { LanguageService } from '../../services/language.service'

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
    ResumeTimelineComponent,
    JsonPipe,
    AppHoverClassDirective,
    UpperCasePipe,
    NgClass
  ],
  templateUrl: './resume-pdf.component.html',
  styleUrls: [
    './resume-pdf.component.scss',
    '../resume-profile/resume-profile.component.scss',
    '../resume-skills/resume-skills.component.scss',
    '../resume-timeline/resume-timeline.component.scss'
  ]
})
export class ResumePdfComponent extends AppDestroy implements OnInit {
  @ViewChild('pictureContainer', { static: false }) pictureContainer!: ElementRef<HTMLDivElement>
  @ViewChild('content', { static: false }) content!: ElementRef<HTMLDivElement>
  @ViewChildren('experienceLogo') experienceLogos!: QueryList<ElementRef<HTMLDivElement>>

  @Input() width: number = 1420

  private readonly pageMargin: number = 80
  private readonly pageAspectRatio: number = 1.414

  readonly pageWidth = this.width + this.pageMargin * 2
  readonly pageHeight = this.pageWidth * this.pageAspectRatio

  isReady = false
  about!: ResumeAbout
  technologies: ResumeTechnologyMapped[] = []
  experiences: ResumeExperienceMapped[] = []
  experienceLogosMap: string[] = []

  profileImageSize!: { [key: string]: string }
  pdf!: jsPDF

  isViewReady$ = new EventEmitter<boolean>()
  isInitDone$ = new EventEmitter<boolean>()

  readonly EXPERIENCES_DISPLAYED: number = 3
  readonly TECHNOLOGIES_DISPLAYED: number = 5

  constructor(
    private dataService: DataService,
    private router: Router,
    private translate: TranslateService,
    private language: LanguageService,
    private ngZone: NgZone
  ) {
    super()
  }

  get getCurrentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  ngOnInit() {
    forkJoin([
      this.dataService.getAbout(),
      this.dataService.getCombinedTechnologies(),
      this.dataService.getCombinedExperience()
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([aboutData, technologiesData, experienceData]) => {
          this.about = aboutData
          this.technologies = technologiesData.slice(0, this.TECHNOLOGIES_DISPLAYED)
          this.experiences = experienceData
        }),
        switchMap(() => {
          this.addSvgAsImage()

          return this.dataService.downloadResume$.asObservable()
        })
      )
      .subscribe(() => {
        this.downloadPDF()
      })
  }

  async addSvgAsImage() {
    for (let index = 0; index < this.experiences.length; index++) {
      const experience = this.experiences[index]
      const svgContent = experience.company.companyLogo

      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()

      img.src = svgUrl

      await new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d') as CanvasRenderingContext2D
          canvas.width = img.width
          canvas.height = img.height
          context.drawImage(img, 0, 0)
          const pngDataUrl = canvas.toDataURL('image/png')
          this.experienceLogosMap.push(pngDataUrl) // Zapisz URL obrazka
          URL.revokeObjectURL(svgUrl) // Zwolnienie zasobów po użyciu URL
          resolve(true)
        }
      })
    }
  }

  async downloadPDF() {
    this.pdf = new jsPDF('portrait', 'px', [this.pageWidth, this.pageHeight], true)
    this.pdf.setFontSize(16)

    this.pdf.html(this.content.nativeElement, {
      autoPaging: 'text',
      fontFaces: this.fontFaces,
      x: this.pageMargin,
      y: 0,
      callback: async (doc) => {
        const documentFilename: string = `resume-szram-${this.getCurrentLanguage}.pdf`

        doc.save(documentFilename)
        await this.router.navigate(['/'])
      }
    })
  }

  calculateTechnologies(technologies: ResumeTechnology[]) {
    return technologies.slice(0, this.TECHNOLOGIES_DISPLAYED)
  }

  calculateDatePeriod(experience: ResumeExperienceMapped) {
    const from = experience.positions[experience.positions.length - 1].date.from
    const to = experience.positions[0].date.to

    const dateFrom = new Date(from)
    const dateTo = to.toLowerCase() === 'present' ? new Date() : new Date(to)

    const diff = dateTo.getTime() - dateFrom.getTime()
    const totalExperience = diff / (1000 * 3600 * 24 * 30.44)

    const totalYears = Math.floor(totalExperience / 12)
    const totalMonths = Math.round(totalExperience % 12)

    const chunks = []

    if (totalYears >= 1) chunks.push(this.language.plural('DATE.YEAR', totalYears))
    if (totalYears >= 1 && totalMonths >= 1) chunks.push(this.language.get('DATE.AND'))
    if (totalMonths >= 1) chunks.push(this.language.plural('DATE.MONTH', totalMonths))

    return chunks.join(' ')
  }

  translatedDate(date: string): string {
    if (date.toLowerCase() === 'present') return this.language.get('DATE.PRESENT')

    const dateObject = new Date(date)
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0')
    const year = dateObject.getFullYear()

    const monthTranslation = this.language.get(`MONTH.${month}`)

    // Get the first three letters of the translated month
    const monthShort = monthTranslation.substring(0, 3).toUpperCase()

    return `${monthShort} ${year}`
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
          { font: 'Mulish-BlackItalic.ttf', weight: 900, style: 'italic' },
          { font: 'Mulish-ExtraBold.ttf', weight: 800 },
          { font: 'Mulish-ExtraBoldItalic.ttf', weight: 800, style: 'italic' },
          { font: 'Mulish-Bold.ttf', weight: 700 },
          { font: 'Mulish-BoldItalic.ttf', weight: 700, style: 'italic' },
          { font: 'Mulish-SemiBold.ttf', weight: 600 },
          { font: 'Mulish-SemiBoldItalic.ttf', weight: 600, style: 'italic' },
          { font: 'Mulish-Medium.ttf', weight: 500 },
          { font: 'Mulish-MediumItalic.ttf', weight: 500, style: 'italic' },
          { font: 'Mulish-Regular.ttf', weight: 400 },
          { font: 'Mulish-Italic.ttf', weight: 400, style: 'italic' }
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
