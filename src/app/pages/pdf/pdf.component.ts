import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  viewChildren
} from '@angular/core'
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import {
  ResumeAbout,
  ResumeExperienceMapped,
  ResumePDFFontFace,
  ResumeTechnology,
  ResumeTechnologyGroup,
  ResumeTechnologyMapped,
  ResumeTechnologyType
} from '../../app.type'
import { HTMLFontFace, jsPDF } from 'jspdf'
import { DataService } from '../../services/data.service'
import { LanguageService } from '../../services/language.service'
import { forkJoin } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-pdf',
  imports: [NgClass, NgStyle, TranslateModule, UpperCasePipe],
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss'
})
export class PdfComponent {
  readonly pictureContainer = viewChild<ElementRef<HTMLDivElement>>('pictureContainer')
  readonly content = viewChild.required<ElementRef<HTMLDivElement>>('content')
  readonly experienceLogos = viewChildren<ElementRef<HTMLDivElement>>('experienceLogo')

  readonly width = input(1360)
  isReady = false
  about!: ResumeAbout
  technologies: ResumeTechnologyMapped[] = []
  experiences: ResumeExperienceMapped[] = []
  experienceLogosMap: string[] = []
  pdf!: jsPDF
  readonly TECH_TYPE = ResumeTechnologyType
  readonly TECH_GROUP = ResumeTechnologyGroup
  private readonly pageMargin = 100
  readonly pageWidth = computed(() => this.width() + this.pageMargin * 2)
  private readonly pageAspectRatio = 1.414
  readonly pageHeight = computed(() => this.pageWidth() * this.pageAspectRatio)
  private readonly dataService = inject(DataService)
  private readonly translate = inject(TranslateService)
  private readonly language = inject(LanguageService)
  private readonly viewReady = signal(false)
  private readonly isDownloadStarted = signal(false)
  private readonly data = toSignal(
    forkJoin({
      about: this.dataService.getAbout(),
      technologies: this.dataService.getCombinedTechnologies(),
      experiences: this.dataService.getCombinedExperience()
    }),
    { initialValue: null }
  )

  constructor() {
    afterNextRender(() => {
      this.viewReady.set(true)
    })

    effect(() => {
      const loadedData = this.data()
      const ready = this.viewReady()

      if (!loadedData || !ready || this.isDownloadStarted()) {
        return
      }

      this.isDownloadStarted.set(true)

      this.about = loadedData.about
      this.technologies = loadedData.technologies
      this.experiences = loadedData.experiences
      this.isReady = true

      void this.generatePdf()
    })
  }

  get getCurrentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
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
      ...addFontFace({
        family: 'Mulish',
        url: '/assets/fonts/Mulish/static/',
        src: [
          { font: 'Mulish-Black.ttf', weight: 900 },
          { font: 'Mulish-ExtraBold.ttf', weight: 800 },
          { font: 'Mulish-Regular.ttf', weight: 400 }
        ]
      }),
      ...addFontFace({
        family: 'Saira Semi Condensed',
        url: '/assets/fonts/SairaSemiCondensed/',
        src: [
          { font: 'SairaSemiCondensed-Bold.ttf', weight: 700 },
          { font: 'SairaSemiCondensed-SemiBold.ttf', weight: 600 }
        ]
      }),
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
          this.experienceLogosMap.push(pngDataUrl)
          URL.revokeObjectURL(svgUrl)
          resolve(true)
        }
      })
    }
  }

  async downloadPDF() {
    this.pdf = new jsPDF('portrait', 'px', [this.pageWidth(), this.pageHeight()], true)
    this.pdf.setFontSize(16)

    this.pdf.html(this.content().nativeElement, {
      margin: [this.pageMargin / 4, this.pageMargin, this.pageMargin / 2, this.pageMargin],
      fontFaces: this.fontFaces,
      x: 0,
      y: 0,
      callback: async (doc) => {
        const documentFilename: string = `resume-szram-${this.getCurrentLanguage}.pdf`

        doc.save(documentFilename)
      }
    })
  }

  sortTechnologies(technologies: ResumeTechnology[]) {
    return technologies.sort((a, b) => {
      const aPriority = this.dataService.priorityTechnologies.indexOf(
        a.type as ResumeTechnologyType
      )
      const bPriority = this.dataService.priorityTechnologies.indexOf(
        b.type as ResumeTechnologyType
      )

      const aEffectivePriority = aPriority === -1 ? 999 : aPriority
      const bEffectivePriority = bPriority === -1 ? 999 : bPriority

      return aEffectivePriority - bEffectivePriority
    })
  }

  translatedDate(date: string): string {
    return this.dataService.translatedDate(date)
  }

  calculateDatePeriod(experience: ResumeExperienceMapped): string {
    return this.dataService.calculateDatePeriod(experience)
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = ('' + phone).replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{3})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
  }

  private async generatePdf() {
    await this.addSvgAsImage()

    setTimeout(() => {
      void this.downloadPDF()
    }, 1000)
  }
}
