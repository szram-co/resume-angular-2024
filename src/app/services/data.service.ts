import { EventEmitter, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { forkJoin, map, Observable, switchMap } from 'rxjs'
import {
  ResumeAbout,
  ResumeCompany,
  ResumeExperience,
  ResumeExperienceMapped,
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

  downloadResume$ = new EventEmitter<boolean>()

  private priorityTechnologies = [
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

  getCombinedTechnologies(): Observable<ResumeTechnologyMapped[]> {
    return this.getTechnologies().pipe(
      map((technologies) => {
        return technologies.map<ResumeTechnologyMapped>((technology, index) => {
          let totalExperience = 90 - index * 2
          return {
            ...technology,
            experience: totalExperience
          }
        })
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
