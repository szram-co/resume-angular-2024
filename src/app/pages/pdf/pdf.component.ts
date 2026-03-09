import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core'
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

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss'
})
export class PdfComponent implements OnDestroy {
  readonly status = signal<'loading' | 'ready' | 'error'>('loading')
  readonly errorMessage = signal('')
  readonly pdfUrl = signal<SafeResourceUrl | null>(null)

  readonly heroMediaWidth = 160
  readonly heroMediaHeight = 320

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
      return this.activeLang() === 'en'
        ? 'PDF preview opened in browser.'
        : 'Podgląd PDF został otwarty w przeglądarce.'
    }

    return this.activeLang() === 'en' ? 'Generating PDF...' : 'Generowanie PDF...'
  })

  readonly renderedLang = signal<'pl' | 'en' | null>(null)

  objectUrl: string | null = null
  pdfMakeLoaded = false
  fontsLoaded = false

  constructor() {
    effect(() => {
      const lang = this.activeLang()
      const data = this.sourceData()

      if (!data || this.renderedLang() === lang) {
        return
      }

      this.renderedLang.set(lang)
      void this.#generatePdfPreview(lang, data)
    })
  }

  ngOnDestroy() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
  }

  async #generatePdfPreview(lang: 'pl' | 'en', data: ResumeData) {
    this.status.set('loading')
    this.errorMessage.set('')

    try {
      await firstValueFrom(this.translate.use(lang))

      const assets = await this.#loadPdfAssets(data)
      const docDefinition = this.#buildDocument(lang, data, assets)
      const pdfMake = await this.#getPdfMake()
      const pdf = pdfMake.createPdf(docDefinition)
      const blob = await pdf.getBlob()
      const url = URL.createObjectURL(blob)

      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl)
      }

      this.objectUrl = url
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#zoom=175`))
      this.status.set('ready')
    } catch (error) {
      console.error('PDF preview generation failed', error)
      this.status.set('error')
      this.errorMessage.set(String(error))
    }
  }

  #buildDocument(lang: 'pl' | 'en', data: ResumeData, assets: PdfAssets): TDocumentDefinitions {
    const t = (key: string): string => this.translate.instant(key)
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
      margin: [0, options?.marginTop ?? 0, 0, 12],
      unbreakable: options?.unbreakable ?? true,
      stack: content
    })

    const sideSections: Content[] = [
      createSideSection(
        [
          { text: t('HEAD.SKILLS').toUpperCase(), style: 'sideSectionTitle' },
          ...skills.map((item) => ({ text: item, style: 'sideListItem' }) as Content)
        ],
        { marginTop: 14 }
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
        margin: [0, 0, 0, 12],
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
                                margin: [0, 0, 0, 4]
                              }
                            ],
                            margin: [0, 0, 0, 0],
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
    const pageContentWidth = 595.28 - 40 - 40

    const experienceItems: Content[] = experiences.map((experience) => {
      const logo = assets.companyLogos.get(experience.company.companyLogo)
      const companyStyle = experience.company.style
      const companyLineColor = this.#resolveStyleValue(companyStyle, '--company-line-c', '#2a9b91')
      const companyLogoBackground = this.#resolveStyleValue(
        companyStyle,
        '--company-logo-b',
        '#ffffff'
      )
      const companyLogoColor = this.#resolveStyleValue(companyStyle, '--company-logo-c', '#111827')
      const companyTextColor = this.#resolveStyleValue(
        companyStyle,
        '--company-text-b',
        companyLineColor
      )
      const locationKey = `CITY_FROM.${experience.company.location.city.toUpperCase()}`
      const location = t(locationKey)
      const companyPeriod = this.dataService.calculateDatePeriod(experience)

      const positions = experience.positions
        .slice()
        .sort((a, b) => this.#dateToTime(b.date.to) - this.#dateToTime(a.date.to))
        .map((position) => {
          const stack = position.technologies.map((item) => item.name).join('  •  ')

          return {
            margin: [0, 10, 0, 10],
            table: {
              widths: [40, '*'],
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
                    margin: [0, 3, 0, 0]
                  },
                  {
                    border: [false, false, false, false],
                    stack: [
                      { text: position.name[lang], style: 'positionTitle', margin: [12, 0, 0, 0] },
                      {
                        text: this.#stripHtml(position.description[lang]),
                        style: 'positionText',
                        margin: [12, 0, 0, 0]
                      },
                      { text: stack, style: 'positionStack', margin: [12, 0, 0, 0] }
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

      return {
        unbreakable: true,
        margin: [0, 0, 0, 14],
        table: {
          widths: [40, '*'],
          body: [
            [
              logo
                ? {
                    border: [false, false, false, false],
                    svg: this.#createCompanyLogoSvg(logo, companyLogoBackground, companyLogoColor),
                    width: 40,
                    height: 40
                  }
                : {
                    border: [false, false, false, false],
                    svg: this.#createFallbackLogoSvg(experience.company.name, companyLineColor),
                    width: 40,
                    height: 40
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
                    margin: [12, 0, 0, 0]
                  },
                  {
                    text: companyPeriod,
                    style: 'companyPeriod',
                    color: companyLineColor,
                    margin: [12, 0, 0, 0]
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
    })

    return {
      info: {
        title: `resume-szram-${lang}`,
        author: data.about.name,
        subject: 'Resume'
      },
      pageSize: 'A4',
      pageMargins: [40, 20, 40, 20],
      defaultStyle: {
        font: 'poppins',
        fontSize: 9,
        color: '#1a1a1a',
        lineHeight: 1.4
      },
      footer: (currentPage, pageCount) => ({
        margin: [28, 2, 28, 8],
        columns: [
          {
            text:
              lang === 'en'
                ? 'Portfolio and references available on request'
                : 'Portfolio i referencje dostępne na życzenie',
            fontSize: 7,
            color: '#6b7280'
          },
          {
            text: `${currentPage}/${pageCount}`,
            alignment: 'right',
            fontSize: 7,
            color: '#6b7280'
          }
        ]
      }),
      content: [
        {
          table: {
            widths: [this.heroMediaWidth, '*'],
            body: [
              [
                {
                  margin: [0, 0, 0, 0],
                  stack: [
                    ...(assets.profileImage
                      ? [
                          {
                            image: assets.profileImage,
                            width: this.heroMediaWidth,
                            height: this.heroMediaHeight,
                            alignment: 'center'
                          } as Content
                        ]
                      : []),
                    {
                      margin: [0, -200, 0, 0],
                      stack: [
                        {
                          svg: this.#createOverlayFadeSvg(this.heroMediaWidth, 200)
                        },
                        {
                          margin: [0, -90, 0, 30],
                          table: {
                            widths: ['*'],
                            body: [
                              [
                                {
                                  margin: [0, 0, 0, 0],
                                  stack: [
                                    { text: data.about.email, style: 'contactOverlay' },
                                    {
                                      margin: [0, 10, 0, 10],
                                      text: data.about.phone,
                                      style: 'contactOverlayStrong'
                                    },
                                    {
                                      text: `${t('CITY.WARSAW')}, ${t('COUNTRY.POLAND')}`,
                                      style: 'contactOverlaySmall'
                                    }
                                  ]
                                }
                              ]
                            ]
                          },
                          layout: 'noBorders'
                        }
                      ]
                    }
                  ]
                },
                {
                  margin: [30, 0, 0, 0],
                  stack: [
                    {
                      columns: badgeLabels.map((label) => this.#createBadgeContent(label)),
                      columnGap: 10
                    },
                    assets.helloByLang[lang]
                      ? ({
                          svg: assets.helloByLang[lang] as string,
                          fit: [240, 75],
                          margin: [0, 20, 0, 20]
                        } as Content)
                      : ({
                          text: t('HELLO').replace(/<br\s*\/?>/gi, ' '),
                          style: 'heroTitle'
                        } as Content),
                    ...intro.map((line) => ({ text: line, style: 'introText' }) as Content)
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
              x1: 0,
              y1: 0,
              x2: pageContentWidth,
              y2: 0,
              lineWidth: 4,
              lineColor: '#2a9b91',
              lineCap: 'round'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: [this.heroMediaWidth, '*'],
            body: [
              [
                {
                  margin: [0, 0, 0, 0],
                  stack: sideSections
                },
                {
                  margin: [30, 4, 0, 0],
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
          fontSize: 7,
          leadingIndent: 12,
          margin: [0, 0, 0, 15],
          alignment: 'justify'
        },
        contactOverlay: {
          fontSize: 10,
          color: '#e5fffb',
          alignment: 'center',
          lineHeight: 1
        },
        contactOverlayStrong: {
          fontSize: 14,
          bold: true,
          color: '#e5fffb',
          alignment: 'center',
          lineHeight: 1
        },
        contactOverlaySmall: {
          fontSize: 8,
          color: '#d2f4ef',
          alignment: 'center',
          lineHeight: 1
        },
        sideSectionTitle: {
          font: 'mulish',
          bold: true,
          fontSize: 12,
          color: '#111827',
          alignment: 'right',
          margin: [0, 0, 0, 10]
        },
        sideListItem: {
          fontSize: 7,
          color: '#374151',
          alignment: 'right'
        },
        sideCourseItem: {
          fontSize: 6.8,
          color: '#374151',
          alignment: 'right',
          margin: [0, 0, 0, 1]
        },
        sideCourseMeta: {
          fontSize: 6.1,
          color: '#6b7280',
          alignment: 'right',
          margin: [0, 0, 0, 6]
        },
        sideLinkItem: {
          fontSize: 6.8,
          color: '#374151',
          alignment: 'right',
          margin: [0, 0, 0, 3]
        },
        sideRecommendationAuthor: {
          fontSize: 6.5,
          bold: true,
          color: '#111827',
          alignment: 'right',
          lineHeight: 1,
          margin: [0, 1, 0, 1]
        },
        sideRecommendationRoleInline: {
          fontSize: 5.4,
          color: '#6b7280',
          alignment: 'right'
        },
        sideRecommendationCompanyInline: {
          fontSize: 5.8,
          color: '#6b7280',
          alignment: 'right'
        },
        sideRecommendationText: {
          fontSize: 6.1,
          color: '#374151',
          italics: true,
          alignment: 'justify',
          lineHeight: 1.25,
          margin: [0, 0, 0, 10]
        },
        experienceHeader: {
          fontSize: 22,
          bold: true,
          color: '#111827',
          margin: [0, 0, 0, 10]
        },
        dotFallback: {
          fontSize: 14,
          color: '#9ca3af'
        },
        companyTitle: {
          fontSize: 15,
          bold: true,
          color: '#1f2937',
          lineHeight: 1
        },
        companyLocation: {
          fontSize: 9,
          color: '#6b7280'
        },
        companyLocationInline: {
          fontSize: 10,
          color: '#6b7280',
          bold: false
        },
        companyPeriod: {
          fontSize: 7,
          color: '#6b7280'
        },
        timelineDateTop: {
          fontSize: 6.4,
          color: '#6b7280',
          alignment: 'center',
          bold: true,
          margin: [0, 0, 0, 2]
        },
        timelineDateCurrent: {
          fontSize: 6.8,
          color: '#6b7280',
          alignment: 'center',
          bold: true,
          margin: [0, 0, 0, 2]
        },
        timelineDateBottom: {
          fontSize: 6,
          color: '#9ca3af',
          alignment: 'center'
        },
        positionTitle: {
          fontSize: 11,
          bold: true,
          color: '#111827',
          margin: [0, 0, 0, 3]
        },
        positionText: {
          fontSize: 7.8,
          italics: true,
          color: '#374151',
          margin: [0, 0, 0, 4]
        },
        positionStack: {
          fontSize: 6.6,
          color: '#6b7280'
        }
      }
    }
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

    const profileImage = profileImageRaw
      ? await this.#createCoverCroppedDataUrl(
          profileImageRaw,
          this.heroMediaWidth,
          this.heroMediaHeight
        ).catch(() => profileImageRaw)
      : null

    return {
      profileImage,
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

  async #createCoverCroppedDataUrl(
    sourceDataUrl: string,
    targetWidth: number,
    targetHeight: number
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const image = new Image()
      const outputScale = 2

      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(targetWidth * outputScale)
        canvas.height = Math.round(targetHeight * outputScale)

        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('Unable to create 2D context for image crop'))
          return
        }

        const scale = Math.max(targetWidth / image.width, targetHeight / image.height)
        const drawWidth = image.width * scale * outputScale
        const drawHeight = image.height * scale * outputScale
        const offsetX = (canvas.width - drawWidth) / 2
        const offsetY = (canvas.height - drawHeight) / 2

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
        resolve(canvas.toDataURL('image/png'))
      }

      image.onerror = () => reject(new Error('Unable to load image for cover crop'))
      image.src = sourceDataUrl
    })
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

  #createBadgeContent(label: string): Content {
    const uppercaseLabel = label.toUpperCase()
    const remScale = 0.35
    const badgeFontSize = 1.35 * 16 * remScale
    const badgeLineHeight = 1.7
    const badgeRadius = 0.35 * 16 * remScale
    const badgePaddingX = 0.75 * 16 * remScale
    const badgePaddingY = 0.35 * 16 * remScale
    const badgeMinWidth = 78
    const badgeBorderWidth = 2 * remScale
    const badgeColor = '#1a1a1a'
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
        badgeColor
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
    // pdfmake's SVG renderer may ignore dominant-baseline, so we compensate manually.
    const textY = height / 2 + fontSize * 0.34

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect x="${borderWidth / 2}" y="${borderWidth / 2}" width="${width - borderWidth}" height="${height - borderWidth}" rx="${radius}" ry="${radius}" fill="none" stroke="${color}" stroke-width="${borderWidth}" /><text x="50%" y="${textY}" text-anchor="middle" font-family="saira" font-size="${fontSize}" font-weight="700" fill="${color}">${escapedLabel}</text></svg>`
  }

  #createOverlayFadeSvg(width: number, height: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="overlayFade" x1="25%" y1="0%" x2="0%" y2="100%"><stop offset="30%" stop-color="#02605c" stop-opacity="0"/><stop offset="55%" stop-color="#02605c" stop-opacity="0.75"/><stop offset="80%" stop-color="#2a9b91" stop-opacity="1"/><stop offset="100%" stop-color="#2a9b91" stop-opacity="1"/></linearGradient></defs><rect x="0" y="0" width="${width}" height="${height}" fill="url(#overlayFade)"/></svg>`
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
        poppinsBlack,
        poppinsBlackitalic,
        poppinsExtrabold,
        poppinsExtrabolditalic,
        poppinsBold,
        poppinsBolditalic,
        poppinsMedium,
        poppinsMediumitalic,
        poppinsRegular,
        poppinsItalic
      ] = await Promise.all([
        this.#fetchAsBase64('/assets/fonts/Mulish/Mulish-Black.ttf'),
        this.#fetchAsBase64('/assets/fonts/SairaSemiCondensed/SairaSemiCondensed-Bold.ttf'),
        this.#fetchAsBase64('/assets/fonts/SairaSemiCondensed/SairaSemiCondensed-SemiBold.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Black.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-BlackItalic.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-ExtraBoldItalic.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Bold.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-BoldItalic.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Medium.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-MediumItalic.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Regular.ttf'),
        this.#fetchAsBase64('/assets/fonts/Poppins/Poppins-Italic.ttf')
      ])

      pdfMake.addVirtualFileSystem({
        'Mulish-Black.ttf': mulishBlack,
        'SairaSemiCondensed-Bold.ttf': sairaBold,
        'SairaSemiCondensed-SemiBold.ttf': sairaSemiBold,
        'Poppins-Black.ttf': poppinsBlack,
        'Poppins-BlackItalic.ttf': poppinsBlackitalic,
        'Poppins-ExtraBold.ttf': poppinsExtrabold,
        'Poppins-ExtraBoldItalic.ttf': poppinsExtrabolditalic,
        'Poppins-Bold.ttf': poppinsBold,
        'Poppins-BoldItalic.ttf': poppinsBolditalic,
        'Poppins-Medium.ttf': poppinsMedium,
        'Poppins-MediumItalic.ttf': poppinsMediumitalic,
        'Poppins-Regular.ttf': poppinsRegular,
        'Poppins-Italic.ttf': poppinsItalic
      })

      pdfMake.addFonts({
        mulish: {
          bold: 'Mulish-Black.ttf'
        },
        poppins: {
          black: 'Poppins-Black.ttf',
          blackitalic: 'Poppins-BlackItalic.ttf',
          extrabold: 'Poppins-ExtraBold.ttf',
          extrabolditalic: 'Poppins-ExtraBoldItalic.ttf',
          bold: 'Poppins-Bold.ttf',
          bolditalic: 'Poppins-BoldItalic.ttf',
          medium: 'Poppins-Medium.ttf',
          mediumitalic: 'Poppins-MediumItalic.ttf',
          normal: 'Poppins-Regular.ttf',
          italics: 'Poppins-Italic.ttf'
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
