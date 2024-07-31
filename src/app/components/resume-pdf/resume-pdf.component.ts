import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { jsPDF } from 'jspdf'
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component'
import { NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { font as futuraPtCondensed500Italic } from './fonts/futura-pt-condensed-500-italic'

@Component({
  selector: 'app-resume-pdf',
  standalone: true,
  imports: [ResumeProfileComponent, NgStyle, NgForOf, NgIf, TranslateModule],
  templateUrl: './resume-pdf.component.html',
  styleUrls: ['./resume-pdf.component.scss', '../resume-profile/resume-profile.component.scss']
})
export class ResumePdfComponent extends AppDestroy implements OnInit, AfterViewInit {
  @ViewChild('content', { static: false }) content!: ElementRef<HTMLDivElement>

  @Input() filename: string = 'resume.pdf'
  @Input() width: number = 1440

  private readonly pageMargin: number = 100
  private readonly pageAspectRatio: number = 1.414

  readonly pageWidth = this.width + this.pageMargin * 2
  readonly pageHeight = this.pageWidth * this.pageAspectRatio

  private readonly imageFormat: string = 'PNG'
  private readonly imageType: string = 'image/png'

  contentElement!: HTMLDivElement
  contentRect!: DOMRect
  contentWidth!: number

  pdf!: jsPDF

  constructor() {
    super()
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.contentElement = this.content.nativeElement
    this.contentRect = this.contentElement.getBoundingClientRect()
    this.contentWidth = this.contentRect.width

    // this.downloadPDF()
  }

  async downloadPDF() {
    this.pdf = new jsPDF('portrait', 'px', [this.pageWidth, this.pageHeight], true)
    this.pdf.setFontSize(16)

    // Set the font using the embedded Base64 data
    this.pdf.addFileToVFS(futuraPtCondensed500Italic, 'futura-pt-condensed')

    //adding the font to jspdf library
    this.pdf.addFont(
      '../../../assets/fonts/futura-pt-condensed-500-italic.woff2',
      'futura-pt-condensed',
      'italic',
      500
    )

    console.warn('@fonts', this.pdf.getFontList())

    // jsPDF.API.events.push([
    //   'addFonts',
    //   function () {
    //     this.addFileToVFS('futura-pt-condensed-500-italic.ttf', font)
    //     this.addFont('futura-pt-condensed-500-italic.ttf', 'futura-pt-condensed-500-italic', 'italic')
    //   }
    // ])

    // this.pdf.setFont('futura-pt-condensed', 'italic', '500')

    this.pdf.html(this.contentElement, {
      callback: (doc) => {
        doc.save(this.filename)
      }
    })
  }

  // downloadPDF() {
  //   // Generate PDF
  //   html2canvas(this.contentElement, { scale: 1 }).then((canvas) => {
  //     this.pdf = new jsPDF('portrait', 'px', [this.pageWidth, this.pageHeight], true)
  //     this.pdf.setDisplayMode('fullwidth')
  //     this.pdf.setFontSize(16)
  //
  //     const canvasData = canvas.toDataURL(this.imageType)
  //     const canvasHeight = (canvas.height * this.contentWidth) / canvas.width
  //
  //     this.pdf.addImage(
  //       canvasData,
  //       this.imageFormat,
  //       this.pageMargin,
  //       0,
  //       this.contentWidth,
  //       canvasHeight
  //     )
  //
  //     this.pdf.save(this.filename)
  //   })
  // }
}
