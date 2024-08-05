import { EventEmitter, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { forkJoin, map, Observable, switchMap } from 'rxjs'
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

@Injectable({
  providedIn: 'root'
})
export class DataService {
  static technologiesMap = new Map<number, ResumeTechnology>()
  static companiesMap = new Map<number, ResumeCompany>()

  totalExperience: number = 0

  downloadResume$ = new EventEmitter<boolean>()

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

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.getTechnologies().subscribe((technologies) => {
      technologies.forEach((technology) =>
        DataService.technologiesMap.set(technology.id, technology)
      )
    })

    this.getExperiences().subscribe((experiences) => {
      experiences.forEach((experience) => {
        const dateFrom = new Date(experience.date.from)
        const dateTo =
          experience.date.to.toLowerCase() === 'present' ? new Date() : new Date(experience.date.to)

        const diff = dateTo.getTime() - dateFrom.getTime()
        const totalExperience = diff / (1000 * 3600 * 24 * 30.44)

        this.totalExperience += Math.round(totalExperience)
      })
    })

    this.loadCompanies().subscribe()
  }

  getSvgContent(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' })
  }

  getAbout() {
    return this.http.get<ResumeAbout>('/assets/data/about.json')
  }

  getCompanies() {
    return this.http.get<ResumeCompany[]>('/assets/data/companies.json').pipe(
      switchMap((companies) => {
        // Load SVGs for each company
        const svgLoaders = companies.map((company) =>
          this.getSvgContent(`assets/images/${company.companyLogo}`).pipe(
            map((svgContent) => {
              company.companyLogo = svgContent
              company.companyLogoContent = this.sanitizer.bypassSecurityTrustHtml(svgContent)
              return company
            })
          )
        )

        return forkJoin(svgLoaders)
      })
    )
  }

  getTechnologies() {
    return this.http.get<ResumeTechnology[]>('/assets/data/technologies.json')
  }

  getExperiences() {
    return this.http.get<ResumeExperience[]>('/assets/data/experience.json')
  }

  loadCompanies(): Observable<ResumeCompany[]> {
    return this.getCompanies().pipe(
      map((companies) => {
        companies.forEach((company) => {
          DataService.companiesMap.set(company.id, company)
        })
        return companies
      })
    )
  }

  private calculateExperienceScore(
    months: number,
    lastUsed: Date,
    continuousUsage: number,
    isLeading: boolean
  ): number {
    const currentDate = new Date()
    const monthsSinceLastUsed =
      (currentDate.getFullYear() - lastUsed.getFullYear()) * 12 +
      currentDate.getMonth() -
      lastUsed.getMonth()

    // Adjust the score based on how long ago it was used
    const rawScore = months / (1 + monthsSinceLastUsed / 12)

    // Apply continuous usage multiplier
    const continuousUsageMultiplier = 1 + continuousUsage / 36 // Assuming 4 years is a significant continuous usage period

    // Apply leading technology multiplier
    const leadingMultiplier = isLeading ? 2 : 1

    const adjustedScore = rawScore * continuousUsageMultiplier * leadingMultiplier

    // Scale score to 0 - 100%
    const maxPossibleScore = this.totalExperience
    const scaledScore = (adjustedScore / maxPossibleScore) * 100

    return Math.min(100, scaledScore) // Ensure the score does not exceed 100%
  }

  getCombinedTechnologies(): Observable<ResumeTechnologyMapped[]> {
    return forkJoin([this.getTechnologies(), this.getExperiences(), this.loadCompanies()]).pipe(
      map(([technologies, experiences]) => {
        const technologyExperienceMap = new Map<number, number>()
        const technologyLastUsedMap = new Map<number, Date>()
        const technologyCompaniesMap = new Map<number, ResumeMappedCompany[]>()
        const technologyContinuousUsageMap = new Map<number, number>()

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
            if (technologyExperienceMap.has(techId)) {
              technologyExperienceMap.set(
                techId,
                technologyExperienceMap.get(techId)! + totalMonths
              )
            } else {
              technologyExperienceMap.set(techId, totalMonths)
            }

            const lastUsedDate = technologyLastUsedMap.get(techId)
            if (!lastUsedDate || dateTo > lastUsedDate) {
              technologyLastUsedMap.set(techId, dateTo)
            }

            // Continuous usage calculation
            if (technologyContinuousUsageMap.has(techId)) {
              technologyContinuousUsageMap.set(
                techId,
                technologyContinuousUsageMap.get(techId)! + totalMonths
              )
            } else {
              technologyContinuousUsageMap.set(techId, totalMonths)
            }

            const companyResume: ResumeMappedCompany = {
              company: DataService.companiesMap.get(experience.company) as ResumeCompany,
              months: totalMonths
            }

            if (technologyCompaniesMap.has(techId)) {
              let companies = technologyCompaniesMap.get(techId) as ResumeMappedCompany[]
              const companyAdded = companies.find((c) => c.company.id === experience.company)

              if (companyAdded) {
                companies = companies.map((c) => {
                  return {
                    ...c,
                    months:
                      c.company.id === companyAdded.company.id ? c.months + totalMonths : c.months
                  }
                })
              } else {
                companies = [...companies, companyResume]
              }

              technologyCompaniesMap.set(techId, [...companies])
            } else {
              technologyExperienceMap.set(techId, totalMonths)
              technologyCompaniesMap.set(techId, [companyResume])
            }
          })
        })

        const sortedTechnologies = technologies
          .map<ResumeTechnologyMapped>((technology) => {
            const totalMonthsExperience = technologyExperienceMap.get(technology.id) || 0
            const lastUsedDate = technologyLastUsedMap.get(technology.id) || new Date()
            const continuousUsage = technologyContinuousUsageMap.get(technology.id) || 0
            const isLeading = technology?.leading || false

            return {
              ...technology,
              experience: {
                months: totalMonthsExperience,
                score: this.calculateExperienceScore(
                  totalMonthsExperience,
                  lastUsedDate,
                  continuousUsage,
                  isLeading
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
              return b.experience.score - a.experience.score // sort by score descending
            }

            return aEffectivePriority - bEffectivePriority // sort by priority
          })

        return sortedTechnologies
      })
    )
  }

  getCombinedExperience(): Observable<ResumeExperienceMapped[]> {
    return forkJoin([this.getExperiences(), this.loadCompanies()]).pipe(
      map(([experiences]) => {
        const experiencesByCompany = experiences
          .sort((a, b) => {
            const dateA = a.date.to === 'present' ? new Date() : new Date(a.date.to)
            const dateB = b.date.to === 'present' ? new Date() : new Date(b.date.to)
            return dateB.getTime() - dateA.getTime()
          })
          .reduce(
            (acc, experience) => {
              const company = DataService.companiesMap.get(experience.company) as ResumeCompany
              const technologies = experience.technologies.map(
                (technologyId) => DataService.technologiesMap.get(technologyId) as ResumeTechnology
              )

              if (!acc[experience.company]) {
                acc[experience.company] = {
                  company: company!,
                  positions: []
                }
              }

              acc[experience.company].positions.push({
                name: experience.name,
                description: experience.description,
                date: experience.date,
                technologies
              })

              return acc
            },
            {} as { [key: number]: ResumeExperienceMapped }
          )

        return Object.values(experiencesByCompany).reverse()
      })
    )
  }
}
