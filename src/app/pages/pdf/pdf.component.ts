import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { toSignal } from '@angular/core/rxjs-interop'
import { firstValueFrom, forkJoin } from 'rxjs'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'

import { TranslateService } from '@ngx-translate/core'
import { DataService } from '../../services/data.service'

type ResumeData = NonNullable<ReturnType<PdfComponent['sourceData']>>

interface PdfAssets {
  profileImage: string | null
  companyLogos: Map<string, string>
  helloByLang: Record<'pl' | 'en', string | null>
  recommendationAvatars: Map<string, string>
}

const remToPdfPt = (rem: number): number => Number((rem * 6.4).toFixed(2))

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss'
})
export class PdfComponent implements OnDestroy {
  readonly displayMode = input<'blob' | 'file'>('file')
  readonly status = signal<'loading' | 'ready' | 'error'>('loading')
  readonly errorMessage = signal('')
  readonly pdfUrl = signal<SafeResourceUrl | null>(null)

  readonly heroMediaWidth = 175
  readonly heroMediaHeight = 300

  readonly route = inject(ActivatedRoute)
  readonly sanitizer = inject(DomSanitizer)
  readonly translate = inject(TranslateService)
  readonly dataService = inject(DataService)

  readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  })

  readonly sourceData = toSignal(
    forkJoin({
      about: this.dataService.getAbout(),
      experiences: this.dataService.getCombinedExperience(),
      recommendations: this.dataService.getRecommendations()
    }),
    { initialValue: null }
  )

  readonly activeLang = computed<'pl' | 'en'>(() =>
    this.routeParams().get('lang') === 'en' ? 'en' : 'pl'
  )

  readonly title = computed(() => (this.activeLang() === 'en' ? 'Resume PDF' : 'PDF CV'))
  readonly subtitle = computed(() => {
    if (this.status() === 'error') {
      return this.activeLang() === 'en'
        ? 'Unable to generate PDF. Please refresh the page.'
        : 'Nie udało się wygenerować PDF. Odśwież stronę.'
    }

    if (this.status() === 'ready') {
      if (this.displayMode() === 'blob') {
        return this.activeLang() === 'en'
          ? 'PDF preview opened in browser.'
          : 'Podgląd PDF został otwarty w przeglądarce.'
      }

      return this.activeLang() === 'en'
        ? 'PDF file downloaded.'
        : 'Plik PDF został pobrany.'
    }

    return this.activeLang() === 'en' ? 'Preparing PDF file...' : 'Przygotowywanie pliku PDF...'
  })

  readonly renderedKey = signal<string | null>(null)

  objectUrl: string | null = null
  pdfMakeLoaded = false
  fontsLoaded = false

  constructor() {
    effect(() => {
      const lang = this.activeLang()
      const data = this.sourceData()
      const displayMode = this.displayMode()
      const renderKey = `${lang}:${displayMode}`

      if (!data || this.renderedKey() === renderKey) {
        return
      }

      void this.#generatePdfOutput(lang, data, displayMode, renderKey)
    })
  }

  ngOnDestroy() {
    this.#clearObjectUrl()
  }

  async #generatePdfOutput(
    lang: 'pl' | 'en',
    data: ResumeData,
    displayMode: 'blob' | 'file',
    renderKey: string
  ) {
    this.status.set('loading')
    this.errorMessage.set('')
    this.pdfUrl.set(null)

    try {
      await firstValueFrom(this.translate.use(lang))

      const assets = await this.#loadPdfAssets(data)
      const docDefinition = this.#buildDocument(lang, data, assets)
      const pdfMake = await this.#getPdfMake()
      const pdf = pdfMake.createPdf(docDefinition)
      const blob = await pdf.getBlob()
      const url = URL.createObjectURL(blob)

      this.#clearObjectUrl()
      this.objectUrl = url

      if (displayMode === 'blob') {
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#zoom=175`))
      } else {
        this.#downloadFile(url, `resume-szram-${lang}.pdf`)
      }

      this.renderedKey.set(renderKey)
      this.status.set('ready')
    } catch (error) {
      console.error('PDF generation failed', error)
      this.status.set('error')
      this.errorMessage.set(String(error))
    }
  }

  #downloadFile(url: string, fileName: string) {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
  }

  #clearObjectUrl() {
    if (!this.objectUrl) {
      return
    }

    URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = null
  }

  #buildDocument(lang: 'pl' | 'en', data: ResumeData, assets: PdfAssets): TDocumentDefinitions {
    const t = (key: string): string => this.translate.instant(key)
    const margin = (left = 0, top = 0, right = 0, bottom = 0): [number, number, number, number] => [
      left,
      top,
      right,
      bottom
    ]
    const { layout: pdfLayout, colors: pdfColors, type: pdfType } = this.#getPdfMetrics()
    const intro = this.#toStringArray(this.translate.instant('DESCRIPTION')).map((item) =>
      this.#stripHtml(item)
    )
    const skills = this.#toStringArray(this.translate.instant('SKILLS')).slice(0, 11)

    const technologies = [
      'JavaScript/TypeScript',
      'Angular/Vue',
      'PHP/SQL',
      'SASS/LESS',
      'Material UI/Bootstrap',
      'PWA/SPA',
      'LINUX/OS X',
      'Docker/GIT'
    ]
    const tools = [
      'Google Cloud Platform',
      'Firebase/Vercel',
      'Photoshop/Illustrator',
      'Webpack/Babel',
      'CI/CD',
      'NODE/NPM'
    ]
    const courses = [
      {
        title: `„${t('COURSE.1')}”`,
        meta: '12.2023 @LinkedIn Courses'
      },
      {
        title: `„${t('COURSE.2')}”`,
        meta: '11.2023 @LinkedIn Courses'
      },
      {
        title: `„${t('COURSE.3')}”`,
        meta: '11.2023 @LinkedIn Courses'
      }
    ]
    const links = data.about.links
    const recommendations = data.recommendations.map((recommendation) => ({
      author: recommendation.author.name,
      role: recommendation.author.role,
      company: recommendation.author.company,
      avatar: assets.recommendationAvatars.get(recommendation.author.name) ?? null,
      content: recommendation.content[lang]
    }))
    const createSideSection = (
      content: Content[],
      options?: { unbreakable?: boolean; marginTop?: number }
    ): Content => ({
      margin: margin(0, options?.marginTop ?? 0, 0, pdfLayout.sideSectionBottom),
      unbreakable: options?.unbreakable ?? true,
      stack: content
    })

    const sideSections: Content[] = [
      createSideSection(
        [
          { text: t('HEAD.SKILLS').toUpperCase(), style: 'sideSectionTitle' },
          ...skills.map((item) => ({ text: item, style: 'sideListItem' }) as Content)
        ],
        { marginTop: pdfLayout.sideSectionFirstTop }
      ),
      createSideSection([
        { text: t('HEAD.TECHNOLOGIES').toUpperCase(), style: 'sideSectionTitle' },
        ...technologies.map((item) => ({ text: item, style: 'sideListItem' }) as Content)
      ]),
      createSideSection([
        { text: t('HEAD.TOOLS').toUpperCase(), style: 'sideSectionTitle' },
        ...tools.map((item) => ({ text: item, style: 'sideListItem' }) as Content)
      ]),
      createSideSection([
        { text: t('HEAD.LINKS').toUpperCase(), style: 'sideSectionTitle' },
        ...links.map(
          (item) =>
            ({
              text: item.name,
              link: item.value,
              style: 'sideLinkItem'
            }) as Content
        )
      ]),
      createSideSection([
        { text: t('HEAD.COURSES').toUpperCase(), style: 'sideSectionTitle' },
        ...courses.flatMap(
          (course) =>
            [
              { text: course.title, style: 'sideCourseItem' },
              { text: course.meta, style: 'sideCourseMeta' }
            ] as Content[]
        )
      ]),
      {
        margin: margin(0, 0, 0, pdfLayout.sideSectionBottom),
        stack: [
          { text: t('HEAD.RECOMMENDATIONS').toUpperCase(), style: 'sideSectionTitle' },
          ...recommendations.map(
            (recommendation) =>
              ({
                unbreakable: true,
                stack: [
                  {
                    table: {
                      widths: ['*', 22],
                      heights: [22],
                      body: [
                        [
                          {
                            border: [false, false, false, false],
                            stack: [
                              { text: recommendation.author, style: 'sideRecommendationAuthor' },
                              {
                                text: [
                                  {
                                    text: recommendation.role,
                                    style: 'sideRecommendationRoleInline'
                                  },
                                  {
                                    text: ` @ ${recommendation.company}`,
                                    style: 'sideRecommendationCompanyInline'
                                  }
                                ],
                                alignment: 'right',
                                margin: margin(0, 0, 0, pdfLayout.recommendationRoleBottom)
                              }
                            ],
                            margin: margin(0, 0, 0, 0),
                            valign: 'middle'
                          },
                          recommendation.avatar
                            ? {
                                border: [false, false, false, false],
                                image: recommendation.avatar,
                                fit: [18, 18],
                                alignment: 'right',
                                valign: 'middle'
                              }
                            : {
                                border: [false, false, false, false],
                                text: ''
                              }
                        ]
                      ]
                    },
                    layout: {
                      hLineWidth: () => 0,
                      vLineWidth: () => 0,
                      paddingLeft: () => 0,
                      paddingRight: () => 0,
                      paddingTop: () => 0,
                      paddingBottom: () => 0
                    }
                  },
                  { text: `“${recommendation.content}”`, style: 'sideRecommendationText' }
                ]
              }) as Content
          )
        ]
      }
    ]

    const experiences = [...data.experiences].sort(
      (a, b) => this.#experienceEnd(b) - this.#experienceEnd(a)
    )

    const badgeLabels = ['Senior Frontend Developer', 'Fullstack Web Developer']
    const pageContentWidth =
      pdfLayout.pageWidth - pdfLayout.pageMargins.left - pdfLayout.pageMargins.right
    const heroContentWidth = pageContentWidth - this.heroMediaWidth - pdfLayout.contentGap
    const experienceColumnWidth = pageContentWidth - this.heroMediaWidth - pdfLayout.contentGap

    const heroRowHeight = this.heroMediaHeight + pdfLayout.contentGap - pdfLayout.introBottom
    const heroOverlayHeight = heroRowHeight
    const heroTextBlockHeight = 72
    const heroTextRowHeight = heroTextBlockHeight / 3
    const heroTextBottomInset = 18
    const heroTextLift = heroTextBlockHeight + heroTextBottomInset

    const continuationNote = t('PDF.CONTINUE_NEXT_PAGE')

    const experienceBlocks = experiences.map((experience) => {
      const logo = assets.companyLogos.get(experience.company.companyLogo)
      const companyStyle = experience.company.style
      const companyLineColor = pdfColors.textStrong
      const companyLogoBackground = this.#resolveStyleValue(
        companyStyle,
        '--company-logo-b',
        pdfColors.background
      )
      const companyLogoColor = this.#resolveStyleValue(
        companyStyle,
        '--company-logo-c',
        pdfColors.textPrimary
      )
      const companyTextColor = pdfColors.textStrong
      const locationKey = `CITY_FROM.${experience.company.location.city.toUpperCase()}`
      const location = t(locationKey)
      const companyPeriod = this.dataService.calculateDatePeriod(experience)

      const positions = experience.positions
        .slice()
        .sort((a, b) => this.#dateToTime(b.date.to) - this.#dateToTime(a.date.to))
        .map((position) => {
          const stack = position.technologies.map((item) => item.name).join('  •  ')
          const description = this.#stripHtml(position.description[lang])

          return {
            margin: margin(0, pdfLayout.positionVertical, 0, pdfLayout.positionVertical),
            table: {
              widths: [pdfLayout.leftColumnWidth, '*'],
              body: [
                [
                  {
                    border: [false, false, false, false],
                    stack: [
                      {
                        text: this.dataService.translatedDate(position.date.to),
                        style:
                          position.date.to.toLowerCase() === 'present'
                            ? 'timelineDateCurrent'
                            : 'timelineDateTop'
                      },
                      {
                        text: this.dataService.translatedDate(position.date.from),
                        style: 'timelineDateBottom'
                      }
                    ],
                    margin: margin(0, pdfLayout.timelineTopOffset, 0, 0)
                  },
                  {
                    border: [false, false, false, false],
                    stack: [
                      {
                        text: position.name[lang],
                        style: 'positionTitle',
                        margin: margin(12, 0, 0, 0)
                      },
                      {
                        text: description,
                        style: 'positionText',
                        margin: margin(12, 0, 0, 0)
                      },
                      { text: stack, style: 'positionStack', margin: margin(12, 10, 0, 0) }
                    ]
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0
            }
          } as Content
        })

      const experienceContent = {
        unbreakable: true,
        margin: margin(0, 0, 0, pdfLayout.companyBottom),
        table: {
          widths: [pdfLayout.leftColumnWidth, '*'],
          body: [
            [
              logo
                ? {
                    border: [false, false, false, false],
                    svg: this.#createCompanyLogoSvg(logo, companyLogoBackground, companyLogoColor),
                    width: pdfLayout.leftColumnWidth,
                    height: pdfLayout.leftColumnWidth
                  }
                : {
                    border: [false, false, false, false],
                    svg: this.#createFallbackLogoSvg(experience.company.name, companyLineColor),
                    width: pdfLayout.leftColumnWidth,
                    height: pdfLayout.leftColumnWidth
                  },
              {
                border: [false, false, false, false],
                stack: [
                  {
                    text: [
                      {
                        text: experience.company.name,
                        style: 'companyTitle',
                        color: companyTextColor
                      },
                      {
                        text: ` ${location}`,
                        style: 'companyLocationInline'
                      }
                    ],
                    margin: margin(12, 0, 0, 0)
                  },
                  {
                    text: companyPeriod,
                    style: 'companyPeriod',
                    color: companyLineColor,
                    margin: margin(12, 0, 0, 0)
                  }
                ]
              }
            ],
            ...positions.map((item) => [
              {
                border: [false, false, false, false],
                colSpan: 2,
                stack: [item]
              },
              {}
            ])
          ]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        }
      } as Content

      return {
        estimatedHeight: this.#estimateExperienceHeight(experience, lang, experienceColumnWidth),
        content: experienceContent
      }
    })

    const experienceItems = this.#paginateExperienceItems(experienceBlocks, continuationNote, {
      firstPageAvailableHeight: 300,
      nextPageAvailableHeight:
        pdfLayout.pageHeight -
        pdfLayout.pageMargins.top -
        pdfLayout.pageMargins.bottom -
        pdfLayout.lastPageBottomReserve
    })

    return {
      info: {
        title: `resume-szram-${lang}`,
        author: data.about.name,
        subject: 'Resume'
      },
      pageSize: 'A4',
      background: () =>
        ({
          svg: this.#createPdfBackgroundSvg(pdfLayout.pageWidth, pdfLayout.pageHeight, pdfColors),
          absolutePosition: { x: 0, y: 0 },
          width: pdfLayout.pageWidth,
          height: pdfLayout.pageHeight
        }) as Content,
      pageMargins: margin(
        pdfLayout.pageMargins.left,
        pdfLayout.pageMargins.top,
        pdfLayout.pageMargins.right,
        pdfLayout.pageMargins.bottom
      ),
      defaultStyle: {
        font: 'poppins',
        fontSize: pdfType.body,
        color: pdfColors.textBase,
        lineHeight: 1.4
      },
      footer: (currentPage, pageCount) => ({
        margin: margin(
          pdfLayout.footerMargins.left,
          pdfLayout.footerMargins.top,
          pdfLayout.footerMargins.right,
          pdfLayout.footerMargins.bottom
        ),
        columns: [
          {
            text: t('PDF.CONSENT'),
            fontSize: pdfType.bodyXs,
            color: pdfColors.textMuted,
            width: pdfLayout.pageWidth * 0.4,
            relativePosition: { x: 0, y: pdfType.bodyXs * -1 },
            lineHeight: 1.15
          },
          {
            text: `${currentPage}/${pageCount}`,
            alignment: 'right',
            fontSize: pdfType.bodyXs,
            color: pdfColors.textMuted
          }
        ]
      }),
      content: [
        {
          table: {
            widths: [this.heroMediaWidth, pdfLayout.contentGap, heroContentWidth],
            heights: [heroRowHeight],
            body: [
              [
                {
                  border: [false, false, false, false],
                  table: {
                    widths: [this.heroMediaWidth],
                    heights: [heroRowHeight],
                    body: [
                      [
                        {
                          border: [false, false, false, false],
                          stack: [
                            ...(assets.profileImage
                              ? [
                                  {
                                    image: assets.profileImage,
                                    cover: {
                                      width: this.heroMediaWidth,
                                      height: heroRowHeight,
                                      valign: 'center',
                                      align: 'center'
                                    }
                                  } as Content
                                ]
                              : [
                                  {
                                    canvas: [
                                      {
                                        type: 'rect',
                                        x: 0,
                                        y: 0,
                                        w: this.heroMediaWidth,
                                        h: heroRowHeight,
                                        color: pdfColors.placeholder
                                      }
                                    ]
                                  } as Content
                                ]),
                            {
                              svg: this.#createOverlayFadeSvg(
                                this.heroMediaWidth,
                                heroOverlayHeight,
                                pdfColors
                              ),
                              width: this.heroMediaWidth,
                              height: heroOverlayHeight,
                              relativePosition: { x: 0, y: -heroOverlayHeight },
                              margin: margin(0, 0, 0, -heroOverlayHeight)
                            } as Content,

                            {
                              table: {
                                widths: ['*'],
                                heights: [heroTextRowHeight, heroTextRowHeight, heroTextRowHeight],
                                body: [
                                  [
                                    {
                                      text: data.about.email,
                                      style: 'contactOverlay'
                                    }
                                  ],
                                  [
                                    {
                                      text: data.about.phone,
                                      style: 'contactOverlayStrong'
                                    }
                                  ],
                                  [
                                    {
                                      text: `${t('CITY.WARSAW')}, ${t('COUNTRY.POLAND')}`,
                                      style: 'contactOverlay',
                                      fontSize: remToPdfPt(1.2)
                                    }
                                  ]
                                ]
                              },
                              layout: {
                                hLineWidth: () => 0,
                                vLineWidth: () => 0,
                                paddingLeft: () => 0,
                                paddingRight: () => 0,
                                paddingTop: () => 0,
                                paddingBottom: () => 0
                              },
                              relativePosition: { x: 0, y: -heroTextLift },
                              margin: margin(0, 0, 0, -heroTextBlockHeight)
                            } as Content
                          ]
                        }
                      ]
                    ]
                  },
                  layout: {
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                    paddingTop: () => 0,
                    paddingBottom: () => 0
                  }
                },
                {
                  border: [false, false, false, false],
                  text: ''
                },
                {
                  border: [false, false, false, false],
                  stack: [
                    {
                      columns: badgeLabels.map((label) =>
                        this.#createBadgeContent(label, pdfType.badge, pdfColors.textBase)
                      ),
                      columnGap: 10
                    },
                    assets.helloByLang[lang]
                      ? ({
                          svg: assets.helloByLang[lang] as string,
                          width: heroContentWidth * 0.8,
                          margin: margin(0, pdfLayout.contentGap, 0, pdfLayout.contentGap)
                        } as Content)
                      : ({
                          text: t('HELLO').replace(/<br\s*\/?>/gi, ' '),
                          style: 'heroTitle'
                        } as Content),
                    ...intro.map(
                      (line, index) =>
                        ({
                          text: line,
                          style: 'introText'
                        }) as Content
                    )
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0
          }
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0.77,
              y1: 0,
              x2: pageContentWidth,
              y2: 0,
              lineWidth: pdfLayout.dividerWidth,
              lineColor: pdfColors.accentLight,
              lineCap: 'round'
            }
          ],
          margin: margin(0, 0, 0, pdfLayout.dividerBottom)
        },
        {
          table: {
            widths: [this.heroMediaWidth, '*'],
            body: [
              [
                {
                  stack: sideSections
                },
                {
                  margin: margin(pdfLayout.contentGap, pdfLayout.companyContentTop, 0, 0),
                  stack: [
                    { text: t('HEAD.EXPERIENCE'), style: 'experienceHeader' },
                    ...experienceItems
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0
          }
        }
      ],
      styles: {
        badge: {
          font: 'saira',
          bold: true
        },
        introText: {
          fontSize: pdfType.body,
          leadingIndent: 12,
          margin: margin(0, 0, 0, pdfLayout.introBottom)
        },
        contactOverlay: {
          fontSize: pdfType.contact,
          color: pdfColors.contactText,
          alignment: 'center',
          lineHeight: 1.4
        },
        contactOverlayStrong: {
          fontSize: pdfType.contactStrong,
          bold: true,
          color: pdfColors.contactText,
          alignment: 'center',
          lineHeight: 1.3
        },
        sideSectionTitle: {
          font: 'mulish',
          bold: true,
          fontSize: pdfType.hSidebar,
          color: pdfColors.textPrimary,
          alignment: 'right',
          margin: margin(0, 0, 0, pdfLayout.sideTitleBottom)
        },
        sideListItem: {
          fontSize: pdfType.body,
          color: pdfColors.textSecondary,
          alignment: 'right'
        },
        sideCourseItem: {
          fontSize: pdfType.body,
          color: pdfColors.textSecondary,
          alignment: 'right',
          margin: margin(0, 0, 0, pdfLayout.courseItemBottom)
        },
        sideCourseMeta: {
          fontSize: pdfType.bodyXs,
          color: pdfColors.textMuted,
          alignment: 'right',
          margin: margin(0, 0, 0, pdfLayout.courseMetaBottom)
        },
        sideLinkItem: {
          fontSize: pdfType.bodySm,
          color: pdfColors.textSecondary,
          alignment: 'right',
          margin: margin(0, 0, 0, pdfLayout.linkBottom)
        },
        sideRecommendationAuthor: {
          fontSize: pdfType.body,
          bold: true,
          color: pdfColors.textPrimary,
          alignment: 'right',
          lineHeight: 1,
          margin: margin(0, 1, 0, 1)
        },
        sideRecommendationRoleInline: {
          fontSize: pdfType.bodyXs,
          color: pdfColors.textMuted,
          alignment: 'right'
        },
        sideRecommendationCompanyInline: {
          fontSize: pdfType.bodyXs,
          color: pdfColors.textMuted,
          alignment: 'right'
        },
        sideRecommendationText: {
          fontSize: pdfType.bodyXs,
          color: pdfColors.textSecondary,
          italics: true,
          alignment: 'justify',
          lineHeight: 1.25,
          margin: margin(0, 0, 0, pdfLayout.recommendationBottom)
        },
        experienceHeader: {
          fontSize: pdfType.hExperience,
          bold: true,
          color: pdfColors.textPrimary,
          margin: margin(0, 0, 0, pdfLayout.experienceHeaderBottom)
        },
        dotFallback: {
          fontSize: pdfType.positionTitle,
          color: pdfColors.textFaint
        },
        companyTitle: {
          fontSize: pdfType.company,
          bold: true,
          color: pdfColors.textBody,
          lineHeight: 1
        },
        companyLocation: {
          fontSize: pdfType.companyLocation,
          color: pdfColors.textMuted
        },
        companyLocationInline: {
          fontSize: pdfType.companyLocation,
          color: pdfColors.textMuted,
          bold: false
        },
        companyPeriod: {
          fontSize: pdfType.companyMeta,
          color: pdfColors.textMuted
        },
        timelineDateTop: {
          fontSize: pdfType.date,
          color: pdfColors.textMuted,
          alignment: 'center',
          bold: true,
          margin: margin(0, 0, 0, 2)
        },
        timelineDateCurrent: {
          fontSize: pdfType.dateCurrent,
          color: pdfColors.textMuted,
          alignment: 'center',
          bold: true,
          margin: margin(0, 0, 0, 2)
        },
        timelineDateBottom: {
          fontSize: pdfType.bodyXs,
          color: pdfColors.textFaint,
          alignment: 'center'
        },
        positionTitle: {
          fontSize: pdfType.positionTitle,
          bold: true,
          color: pdfColors.textPrimary,
          margin: margin(0, 0, 0, 3)
        },
        positionText: {
          fontSize: pdfType.body,
          color: pdfColors.textSecondary,
          margin: margin(0, 0, 0, 4)
        },
        positionStack: {
          fontSize: pdfType.bodySm,
          color: pdfColors.textMuted
        },
        continueNote: {
          fontSize: pdfType.bodySm,
          italics: true,
          color: pdfColors.textMuted,
          alignment: 'center',
          margin: margin(
            pdfLayout.leftColumnWidth,
            pdfLayout.continueNoteTop,
            0,
            pdfLayout.continueNoteBottom
          )
        }
      }
    }
  }

  #paginateExperienceItems(
    items: Array<{ estimatedHeight: number; content: Content }>,
    note: string,
    options: { firstPageAvailableHeight: number; nextPageAvailableHeight: number }
  ): Content[] {
    const result: Content[] = []
    let remainingHeight = options.firstPageAvailableHeight

    items.forEach((item, index) => {
      if (index > 0 && item.estimatedHeight > remainingHeight) {
        result.push({ text: note, style: 'continueNote' })
        result.push({
          ...(item.content as unknown as Record<string, unknown>),
          pageBreak: 'before'
        } as Content)
        remainingHeight = options.nextPageAvailableHeight - item.estimatedHeight
        return
      }

      result.push(item.content)
      remainingHeight -= item.estimatedHeight
    })

    return result
  }

  #estimateExperienceHeight(
    experience: ResumeData['experiences'][number],
    lang: 'pl' | 'en',
    columnWidth: number
  ): number {
    const companyHeaderHeight = 52
    const companyBottomSpacing = 14
    const positionBaseHeight = 44
    const positionVerticalSpacing = 20
    const descriptionCharsPerLine = Math.max(42, Math.floor(columnWidth / 4.7))
    const stackCharsPerLine = Math.max(36, Math.floor(columnWidth / 5.2))

    const positionsHeight = experience.positions.reduce((total, position) => {
      const description = this.#stripHtml(position.description[lang])
      const technologies = position.technologies.map((item) => item.name).join('  •  ')
      const nameLines = this.#estimateTextLines(position.name[lang], descriptionCharsPerLine)
      const descriptionLines = this.#estimateTextLines(description, descriptionCharsPerLine)
      const stackLines = this.#estimateTextLines(technologies, stackCharsPerLine)

      return (
        total +
        positionBaseHeight +
        nameLines * 12 +
        descriptionLines * 9 +
        stackLines * 7 +
        positionVerticalSpacing
      )
    }, 0)

    return companyHeaderHeight + companyBottomSpacing + positionsHeight
  }

  #estimateTextLines(text: string, charsPerLine: number): number {
    if (!text.trim()) {
      return 1
    }

    return text
      .split('\n')
      .reduce((total, line) => total + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0)
  }

  #getPdfMetrics() {
    const colors = {
      background: '#ffffff',
      glowLeft: '#cbd4d9',
      glowRight: '#9ac5c3',
      accent: '#02605c',
      accentLight: '#2a9b91',
      textPrimary: '#111827',
      textStrong: '#0e1b1b',
      textBody: '#1f2937',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      textFaint: '#9ca3af',
      textBase: '#1a1a1a',
      contactText: '#e5fffb',
      contactTextFaint: '#d2f4ef',
      placeholder: '#d1d5db'
    } as const

    const layout = {
      pageWidth: 595.28,
      pageHeight: 841.89,
      pageMargins: { left: 30, top: 25, right: 30, bottom: 25 },
      footerMargins: { left: 30, top: 0, right: 30, bottom: 0 },
      contentGap: 22,
      leftColumnWidth: 32,
      sideSectionBottom: 12,
      sideSectionFirstTop: 10,
      sideTitleBottom: 10,
      courseMetaBottom: 6,
      courseItemBottom: 1,
      linkBottom: 3,
      recommendationBottom: 10,
      recommendationRoleBottom: 4,
      introBottom: 10,
      dividerBottom: 20,
      dividerWidth: 2,
      positionVertical: 10,
      timelineTopOffset: 3,
      companyBottom: 14,
      companyContentTop: 4,
      experienceHeaderBottom: 10,
      continueNoteTop: 50,
      continueNoteBottom: 0,
      // consentTop: 175,
      lastPageBottomReserve: 42
    } as const

    const type = {
      body: remToPdfPt(1.125),
      bodySm: remToPdfPt(1),
      bodyXs: remToPdfPt(0.875),
      hSidebar: remToPdfPt(1.875),
      hExperience: remToPdfPt(3.75),
      company: remToPdfPt(1.6875),
      companyLocation: remToPdfPt(1.375),
      companyMeta: remToPdfPt(1),
      positionTitle: remToPdfPt(1.5),
      date: remToPdfPt(1),
      dateCurrent: remToPdfPt(1.126),
      badge: remToPdfPt(1.1),
      contact: remToPdfPt(1.5),
      contactStrong: remToPdfPt(2)
    } as const

    return { layout, colors, type }
  }

  async #loadPdfAssets(data: ResumeData): Promise<PdfAssets> {
    const logoNames = Array.from(new Set(data.experiences.map((item) => item.company.companyLogo)))
    const recommendationAvatarEntries = await Promise.all(
      data.recommendations.map(async (recommendation) => {
        const avatarUrl = recommendation.author.avatar

        if (!avatarUrl) {
          return [recommendation.author.name, null] as const
        }

        const avatar = await this.#fetchAsDataUrl(avatarUrl)
          .then((dataUrl) => this.#createCircularAvatarDataUrl(dataUrl, 48))
          .catch(() => null)
        return [recommendation.author.name, avatar] as const
      })
    )

    const [profileImageRaw, logoEntries, helloPl, helloEn] = await Promise.all([
      this.#fetchAsDataUrl('/assets/images/profile-image.jpg').catch(() => null),
      Promise.all(
        logoNames.map(async (logoName) => {
          const svg = await this.#fetchText(`/assets/images/${logoName}`)
          return [logoName, this.#normalizeSvg(svg)] as const
        })
      ).catch(() => [] as Array<readonly [string, string]>),
      this.#fetchText('/assets/images/resume-hello-pl.svg')
        .then((svg) => this.#normalizeSvg(svg))
        .catch(() => null),
      this.#fetchText('/assets/images/resume-hello-en.svg')
        .then((svg) => this.#normalizeSvg(svg))
        .catch(() => null)
    ])

    return {
      profileImage: profileImageRaw,
      companyLogos: new Map(logoEntries),
      helloByLang: {
        pl: helloPl,
        en: helloEn
      },
      recommendationAvatars: new Map(
        recommendationAvatarEntries.filter((entry): entry is readonly [string, string] =>
          Boolean(entry[1])
        )
      )
    }
  }

  async #fetchAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Unable to fetch image: ${url}`)
    }

    const blob = await response.blob()

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error(`Unable to convert image to data URL: ${url}`))
      reader.readAsDataURL(blob)
    })
  }

  async #fetchText(url: string): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Unable to fetch text asset: ${url}`)
    }

    return response.text()
  }

  async #fetchAsBase64(url: string): Promise<string> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Unable to fetch font file: ${url}`)
    }

    const bytes = new Uint8Array(await response.arrayBuffer())
    let binary = ''
    const chunkSize = 0x8000

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }

    return btoa(binary)
  }

  async #createCircularAvatarDataUrl(sourceDataUrl: string, targetSize: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const image = new Image()
      const outputScale = 2

      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(targetSize * outputScale)
        canvas.height = Math.round(targetSize * outputScale)

        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('Unable to create 2D context for avatar crop'))
          return
        }

        const scale = Math.max(targetSize / image.width, targetSize / image.height)
        const drawWidth = image.width * scale * outputScale
        const drawHeight = image.height * scale * outputScale
        const offsetX = (canvas.width - drawWidth) / 2
        const offsetY = (canvas.height - drawHeight) / 2
        const radius = canvas.width / 2

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.beginPath()
        context.arc(radius, radius, radius, 0, Math.PI * 2)
        context.closePath()
        context.clip()
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
        resolve(canvas.toDataURL('image/png'))
      }

      image.onerror = () => reject(new Error('Unable to load image for avatar crop'))
      image.src = sourceDataUrl
    })
  }

  #normalizeSvg(svg: string): string {
    return svg.replace(/<\?xml[\s\S]*?\?>/g, '').trim()
  }

  #resolveStyleValue(
    styles: Record<string, string> | undefined,
    key: string,
    fallback: string,
    visited = new Set<string>()
  ): string {
    const value = styles?.[key]

    if (!value) {
      return fallback
    }

    const variableMatch = value.match(/^var\((--[^),\s]+)(?:,\s*([^)]+))?\)$/)

    if (!variableMatch) {
      return value
    }

    const [, nestedKey, nestedFallback] = variableMatch

    if (visited.has(nestedKey)) {
      return nestedFallback?.trim() ?? fallback
    }

    visited.add(nestedKey)

    return this.#resolveStyleValue(styles, nestedKey, nestedFallback?.trim() ?? fallback, visited)
  }

  #createCompanyLogoSvg(svg: string, backgroundColor: string, foregroundColor: string): string {
    const normalizedSvg = this.#normalizeSvg(svg)
      .replace(/var\(--company-logo-c,\s*[^)]+\)/g, foregroundColor)
      .replace(/var\(--company-logo-b,\s*[^)]+\)/g, backgroundColor)

    return normalizedSvg.replace(
      /<svg\b([^>]*)>/,
      `<svg$1><rect x="0" y="0" width="100%" height="100%" fill="${backgroundColor}" />`
    )
  }

  #createFallbackLogoSvg(label: string, color: string): string {
    const acronym = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')

    return this.#createBadgeSvg(acronym || 'CV', 36, 36, 8, 2, 16, color)
  }

  #createBadgeContent(label: string, fontSize: number, color: string): Content {
    const uppercaseLabel = label.toUpperCase()
    const badgeFontSize = fontSize
    const badgeLineHeight = 1.7
    const badgeRadius = fontSize * 0.42
    const badgePaddingX = fontSize * 0.9
    const badgePaddingY = fontSize * 0.42
    const badgeMinWidth = Math.ceil(fontSize * 6.5)
    const badgeBorderWidth = Math.max(0.125, fontSize * 0.15)
    const estimatedTextWidth = Math.ceil(uppercaseLabel.length * badgeFontSize * 0.58)
    const badgeHeight = Math.ceil(
      badgeFontSize * badgeLineHeight + badgePaddingY * 2 + badgeBorderWidth * 2
    )
    const badgeWidth = Math.max(
      badgeMinWidth,
      Math.ceil(estimatedTextWidth + badgePaddingX * 2 + badgeBorderWidth * 2)
    )

    return {
      width: badgeWidth,
      svg: this.#createBadgeSvg(
        uppercaseLabel,
        badgeWidth,
        badgeHeight,
        badgeRadius,
        badgeBorderWidth,
        badgeFontSize,
        color
      )
    } as Content
  }

  #createBadgeSvg(
    label: string,
    width: number,
    height: number,
    radius: number,
    borderWidth: number,
    fontSize: number,
    color: string
  ): string {
    const escapedLabel = this.#escapeXml(label)
    const textY = height / 2 + fontSize * 0.34

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${width - borderWidth}" height="${height - borderWidth}" rx="${radius}" ry="${radius}" fill="none" stroke="${color}" stroke-width="${borderWidth}" /><text x="50%" y="${textY}" text-anchor="middle" font-family="saira" font-size="${fontSize}" font-weight="700" fill="${color}">${escapedLabel}</text></svg>`
  }

  #createOverlayFadeSvg(
    width: number,
    height: number,
    colors: { accent: string; accentLight: string }
  ): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="overlayFade" x1="10%" y1="0%" x2="0%" y2="100%"><stop offset="30%" stop-color="${colors.accent}" stop-opacity="0"/><stop offset="75%" stop-color="${colors.accent}" stop-opacity="0.75"/><stop offset="90%" stop-color="${colors.accentLight}" stop-opacity="1"/><stop offset="100%" stop-color="${colors.accentLight}" stop-opacity="1"/></linearGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="url(#overlayFade)"/></svg>`
  }

  #createPdfBackgroundSvg(
    width: number,
    height: number,
    colors: { background: string; glowLeft: string; glowRight: string }
  ): string {
    const rightGlowX = width
    const leftGlowX = 20
    const glowY = 0
    const glowRadius = Math.max(width * 0.75, height * 0.5)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><radialGradient id="pdfGlowLeft" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${leftGlowX} ${glowY}) rotate(90) scale(${glowRadius})"><stop stop-color="${colors.glowLeft}" stop-opacity="0.33"/><stop offset="1" stop-color="${colors.glowLeft}" stop-opacity="0"/></radialGradient><radialGradient id="pdfGlowRight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${rightGlowX} ${glowY}) rotate(90) scale(${glowRadius})"><stop stop-color="${colors.glowRight}" stop-opacity="0.4"/><stop offset="1" stop-color="${colors.glowRight}" stop-opacity="0"/></radialGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="${colors.background}"/><circle cx="${leftGlowX}" cy="${glowY}" r="${glowRadius}" fill="url(#pdfGlowLeft)"/><circle cx="${rightGlowX}" cy="${glowY}" r="${glowRadius}" fill="url(#pdfGlowRight)"/></svg>`
  }

  #escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  #stripHtml(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  #dateToTime(date: string): number {
    if (date.toLowerCase() === 'present') {
      return Number.MAX_SAFE_INTEGER
    }

    return new Date(date).getTime()
  }

  #experienceEnd(experience: ResumeData['experiences'][number]): number {
    const latestPosition = experience.positions.reduce((latest, position) => {
      return this.#dateToTime(position.date.to) > this.#dateToTime(latest.date.to)
        ? position
        : latest
    })

    return this.#dateToTime(latestPosition.date.to)
  }

  #toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter((item): item is string => typeof item === 'string')
  }

  async #getPdfMake() {
    const pdfMakeModule = await import('pdfmake/build/pdfmake')
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
    const pdfMake = pdfMakeModule.default as any

    if (!this.pdfMakeLoaded) {
      pdfMake.addVirtualFileSystem(pdfFontsModule.default)
      this.pdfMakeLoaded = true
    }

    if (!this.fontsLoaded) {
      const [
        mulishBlack,
        sairaBold,
        sairaSemiBold,
        poppinsBold,
        poppinsBoldItalic,
        poppinsRegular,
        poppinsItalic
      ] = await Promise.all([
        this.#fetchAsBase64('/assets/fonts/Mulish/Mulish-Black.ttf'),
        this.#fetchAsBase64('/assets/fonts/SairaSemiCondensed/SairaSemiCondensed-Bold.ttf'),
        this.#fetchAsBase64('/assets/fonts/SairaSemiCondensed/SairaSemiCondensed-SemiBold.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Bold.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-BoldItalic.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Regular.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Italic.ttf')
      ])

      pdfMake.addVirtualFileSystem({
        'Mulish-Black.ttf': mulishBlack,
        'SairaSemiCondensed-Bold.ttf': sairaBold,
        'SairaSemiCondensed-SemiBold.ttf': sairaSemiBold,
        'Poppins-Bold.ttf': poppinsBold,
        'Poppins-BoldItalic.ttf': poppinsBoldItalic,
        'Poppins-Regular.ttf': poppinsRegular,
        'Poppins-Italic.ttf': poppinsItalic
      })

      pdfMake.addFonts({
        mulish: {
          bold: 'Mulish-Black.ttf'
        },
        poppins: {
          normal: 'Poppins-Regular.ttf',
          bold: 'Poppins-Bold.ttf',
          italics: 'Poppins-Italic.ttf',
          bolditalics: 'Poppins-BoldItalic.ttf'
        },
        saira: {
          normal: 'SairaSemiCondensed-SemiBold.ttf',
          bold: 'SairaSemiCondensed-Bold.ttf',
          italics: 'SairaSemiCondensed-SemiBold.ttf',
          bolditalics: 'SairaSemiCondensed-Bold.ttf'
        }
      })

      this.fontsLoaded = true
    }

    return pdfMake
  }
}
