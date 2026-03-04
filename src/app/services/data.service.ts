import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { forkJoin, map, Observable, shareReplay, switchMap } from 'rxjs'
import {
  ResumeAbout,
  ResumeCompany,
  ResumeExperience,
  ResumeExperienceMapped,
  ResumeMappedCompany,
  ResumeTechnology,
  ResumeTechnologyMapped,
  ResumeTechnologyType
} from '../app.type'
import { DomSanitizer } from '@angular/platform-browser'
import { LanguageService } from './language.service'

@Injectable({
  providedIn: 'root'
})
export class DataService {
  priorityTechnologies = [
    ResumeTechnologyType.language,
    ResumeTechnologyType.framework,
    ResumeTechnologyType.preprocessor,
    ResumeTechnologyType.frontend,
    ResumeTechnologyType.web,
    ResumeTechnologyType.library,
    ResumeTechnologyType.cms,
    ResumeTechnologyType.tool,
    ResumeTechnologyType.design,
    ResumeTechnologyType.system,
    ResumeTechnologyType.methodology
  ]
  private readonly about$ = this.http
    .get<ResumeAbout>('/assets/data/about.json')
    .pipe(shareReplay(1))
  private readonly technologies$ = this.http
    .get<ResumeTechnology[]>('/assets/data/technologies.json')
    .pipe(shareReplay(1))
  private readonly experiences$ = this.http
    .get<ResumeExperience[]>('/assets/data/experience.json')
    .pipe(shareReplay(1))
  private readonly companies$ = this.http.get<ResumeCompany[]>('/assets/data/companies.json').pipe(
    switchMap((companies) => {
      const svgLoaders = companies.map((company) =>
        this.getSvgContent(`assets/images/${company.companyLogo}`).pipe(
          map((svgContent) => ({
            ...company,
            companyLogoContent: this.sanitizer.bypassSecurityTrustHtml(svgContent)
          }))
        )
      )

      return forkJoin(svgLoaders)
    }),
    shareReplay(1)
  )

  constructor(
    private http: HttpClient,
    private language: LanguageService,
    private sanitizer: DomSanitizer
  ) {}

  getAbout() {
    return this.about$
  }

  getSvgContent(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' })
  }

  getCompanies() {
    return this.companies$
  }

  getTechnologies() {
    return this.technologies$
  }

  getExperiences() {
    return this.experiences$
  }

  loadCompanies(): Observable<ResumeCompany[]> {
    return this.getCompanies()
  }

  getCombinedTechnologies(): Observable<ResumeTechnologyMapped[]> {
    return forkJoin({
      technologies: this.getTechnologies(),
      experiences: this.getExperiences(),
      companies: this.getCompanies()
    }).pipe(
      map(({ technologies, experiences, companies }) => {
        const companiesMap = new Map<number, ResumeCompany>(
          companies.map((company) => [company.id, company])
        )

        const technologyExperienceMap = new Map<number, number>()
        const technologyLastUsedMap = new Map<number, Date>()
        const technologyCompaniesMap = new Map<number, ResumeMappedCompany[]>()
        const technologyContinuousUsageMap = new Map<number, number>()

        const totalExperienceInMonths = experiences.reduce((total, experience) => {
          const dateFrom = new Date(experience.date.from)
          const dateTo =
            experience.date.to.toLowerCase() === 'present'
              ? new Date()
              : new Date(experience.date.to)

          const diff = dateTo.getTime() - dateFrom.getTime()
          const totalExperience = diff / (1000 * 3600 * 24 * 30.44)

          return total + Math.round(totalExperience)
        }, 0)

        experiences.forEach((experience) => {
          const dateFrom = new Date(experience.date.from)
          const dateTo =
            experience.date.to.toLowerCase() === 'present'
              ? new Date()
              : new Date(experience.date.to)

          const diff = dateTo.getTime() - dateFrom.getTime()
          const totalExperience = diff / (1000 * 3600 * 24 * 30.44)
          const totalMonths = Math.round(totalExperience)

          experience.technologies.forEach((techId) => {
            const existingExperience = technologyExperienceMap.get(techId) ?? 0
            technologyExperienceMap.set(techId, existingExperience + totalMonths)

            const lastUsedDate = technologyLastUsedMap.get(techId)
            if (!lastUsedDate || dateTo > lastUsedDate) {
              technologyLastUsedMap.set(techId, dateTo)
            }

            const existingContinuousUsage = technologyContinuousUsageMap.get(techId) ?? 0
            technologyContinuousUsageMap.set(techId, existingContinuousUsage + totalMonths)

            const company = companiesMap.get(experience.company)
            if (!company) {
              return
            }

            const companyResume: ResumeMappedCompany = {
              company,
              months: totalMonths
            }

            const companiesForTech = technologyCompaniesMap.get(techId) ?? []
            const existingCompany = companiesForTech.find(
              (entry) => entry.company.id === company.id
            )

            if (existingCompany) {
              technologyCompaniesMap.set(
                techId,
                companiesForTech.map((entry) =>
                  entry.company.id === company.id
                    ? { ...entry, months: entry.months + totalMonths }
                    : entry
                )
              )
            } else {
              technologyCompaniesMap.set(techId, [...companiesForTech, companyResume])
            }
          })
        })

        return technologies
          .map<ResumeTechnologyMapped>((technology) => {
            const totalMonthsExperience = technologyExperienceMap.get(technology.id) ?? 0
            const lastUsedDate = technologyLastUsedMap.get(technology.id) ?? new Date()
            const continuousUsage = technologyContinuousUsageMap.get(technology.id) ?? 0
            const isLeading = technology.leading ?? false

            return {
              ...technology,
              experience: {
                months: totalMonthsExperience,
                score: this.calculateExperienceScore(
                  totalMonthsExperience,
                  lastUsedDate,
                  continuousUsage,
                  isLeading,
                  totalExperienceInMonths
                ),
                data: {
                  totalMonthsExperience,
                  lastUsedDate,
                  continuousUsage,
                  isLeading
                }
              },
              companies: technologyCompaniesMap.get(technology.id)
            } as ResumeTechnologyMapped
          })
          .sort((a, b) => {
            const aPriority = this.priorityTechnologies.indexOf(a.type as ResumeTechnologyType)
            const bPriority = this.priorityTechnologies.indexOf(b.type as ResumeTechnologyType)

            const aEffectivePriority = aPriority === -1 ? 999 : aPriority
            const bEffectivePriority = bPriority === -1 ? 999 : bPriority

            if (aEffectivePriority === bEffectivePriority) {
              return b.experience.score - a.experience.score
            }

            return aEffectivePriority - bEffectivePriority
          })
      })
    )
  }

  getCombinedExperience(): Observable<ResumeExperienceMapped[]> {
    return forkJoin({
      technologies: this.getTechnologies(),
      experiences: this.getExperiences(),
      companies: this.getCompanies()
    }).pipe(
      map(({ technologies, experiences, companies }) => {
        const technologiesMap = new Map<number, ResumeTechnology>(
          technologies.map((technology) => [technology.id, technology])
        )
        const companiesMap = new Map<number, ResumeCompany>(
          companies.map((company) => [company.id, company])
        )

        const experiencesByCompany = experiences
          .sort((a, b) => {
            const dateA = a.date.to === 'present' ? new Date() : new Date(a.date.to)
            const dateB = b.date.to === 'present' ? new Date() : new Date(b.date.to)
            return dateB.getTime() - dateA.getTime()
          })
          .reduce(
            (acc, experience) => {
              const company = companiesMap.get(experience.company)

              if (!company) {
                return acc
              }

              const mappedTechnologies = experience.technologies
                .map((technologyId) => technologiesMap.get(technologyId))
                .filter((technology): technology is ResumeTechnology => Boolean(technology))

              if (!acc[experience.company]) {
                acc[experience.company] = {
                  company,
                  positions: []
                }
              }

              acc[experience.company].positions.push({
                name: experience.name,
                description: experience.description,
                short_description: experience.short_description,
                date: experience.date,
                technologies: mappedTechnologies
              })

              return acc
            },
            {} as { [key: number]: ResumeExperienceMapped }
          )

        return Object.values(experiencesByCompany).reverse()
      })
    )
  }

  public calculateDatePeriod(experience: ResumeExperienceMapped) {
    const from = experience.positions[experience.positions.length - 1].date.from
    const to = experience.positions[0].date.to

    const dateFrom = new Date(from)
    const dateTo = to.toLowerCase() === 'present' ? new Date() : new Date(to)

    const { years, months, days } = this.calculateCalendarDiff(dateFrom, dateTo)
    let totalYears = years
    let totalMonths = months

    // Produktowo: jeżeli są pozostałe dni, podbijamy miesiące o 1.
    if (days > 0) {
      totalMonths += 1
    }

    if (totalMonths >= 12) {
      totalYears += Math.floor(totalMonths / 12)
      totalMonths %= 12
    }

    const chunks = []

    if (totalYears >= 1) chunks.push(this.language.plural('DATE.YEAR', totalYears))
    if (totalYears >= 1 && totalMonths >= 1) chunks.push(this.language.get('DATE.AND'))
    if (totalMonths >= 1) chunks.push(this.language.plural('DATE.MONTH', totalMonths))

    return chunks.join(' ')
  }

  public translatedDate(date: string): string {
    if (date.toLowerCase() === 'present') return this.language.get('DATE.PRESENT')

    const dateObject = new Date(date)
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0')
    const year = dateObject.getFullYear()

    const monthTranslation = this.language.get(`MONTH.${month}`)
    const monthShort = monthTranslation.substring(0, 3).toUpperCase()

    return `${monthShort} ${year}`
  }

  private calculateCalendarDiff(from: Date, to: Date) {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())

    if (end < start) {
      return { years: 0, months: 0, days: 0 }
    }

    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    let days = end.getDate() - start.getDate()

    if (days < 0) {
      months -= 1
      const previousMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate()
      days += previousMonthDays
    }

    if (months < 0) {
      years -= 1
      months += 12
    }

    return { years, months, days }
  }

  private calculateExperienceScore(
    months: number,
    lastUsed: Date,
    continuousUsage: number,
    isLeading: boolean,
    maxPossibleScore: number
  ): number {
    const currentDate = new Date()
    const monthsSinceLastUsed =
      (currentDate.getFullYear() - lastUsed.getFullYear()) * 12 +
      currentDate.getMonth() -
      lastUsed.getMonth()

    const rawScore = months / (1 + monthsSinceLastUsed / 12)
    const continuousUsageMultiplier = 1 + continuousUsage / 36
    const leadingMultiplier = isLeading ? 2 : 1

    const adjustedScore = rawScore * continuousUsageMultiplier * leadingMultiplier
    const safeMaxScore = maxPossibleScore > 0 ? maxPossibleScore : 1
    const scaledScore = (adjustedScore / safeMaxScore) * 100

    return Math.min(100, scaledScore)
  }
}
