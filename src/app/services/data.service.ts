import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { map, Observable } from 'rxjs'
import {
  ResumeAbout,
  ResumeCompany,
  ResumeExperience,
  ResumeExperienceMapped,
  ResumeTechnology,
  ResumeTechnologyMapped,
  ResumeTechnologyType
} from '../app.type'

@Injectable({
  providedIn: 'root'
})
export class DataService {
  static technologiesMap = new Map<number, ResumeTechnology>()
  static companiesMap = new Map<number, ResumeCompany>()

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

  constructor(private http: HttpClient) {
    this.getTechnologies().subscribe((technologies) => {
      technologies.forEach((technology) =>
        DataService.technologiesMap.set(technology.id, technology)
      )
    })

    this.getCompanies().subscribe((companies) => {
      companies.forEach((company) => DataService.companiesMap.set(company.id, company))
    })
  }

  getAbout() {
    return this.http.get<ResumeAbout>('/assets/data/about.json')
  }

  getCompanies() {
    return this.http.get<ResumeCompany[]>('/assets/data/companies.json')
  }

  getTechnologies() {
    return this.http.get<ResumeTechnology[]>('/assets/data/technologies.json')
  }

  getExperiences() {
    return this.http.get<ResumeExperience[]>('/assets/data/experience.json')
  }

  getCombinedTechnologies(): Observable<ResumeTechnologyMapped[]> {
    return this.getTechnologies().pipe(
      map((technologies) => {
        // TODO: Count experience of technology
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
    return this.getExperiences().pipe(
      map((experiences) => {
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

  public calculateMonths(from: string, to: string | 'present'): number {
    const startDate = new Date(from)
    const endDate = to.toLowerCase() === 'present' ? new Date() : new Date(to)
    const diff = endDate.getTime() - startDate.getTime()
    return diff / ((1000 * 3600 * 24 * 365.25) / 12) // divide by milliseconds in a year
  }
}
