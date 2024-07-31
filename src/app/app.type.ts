export interface TranslatedValue<T = string> {
  pl: T
  en: T
}

export interface DatePeriod<T = string> {
  from: T
  to: T | 'present'
}

export enum ResumeTechnologyType {
  'language',
  'framework',
  'preprocessor',
  'frontend',
  'web',
  'library',
  'cms',
  'tool',
  'design',
  'system',
  'methodology'
}

export enum ResumeTechnologyGroup {
  'frontend',
  'backend'
}

export interface ResumeTechnology {
  id: number
  name: string
  skillAssessment: boolean
  type: ResumeTechnologyType
  group: ResumeTechnologyGroup
}

export interface ResumeTechnologyMapped extends ResumeTechnology {
  experience: number
}

export interface ResumeCompany {
  id: number
  name: string
  companyLogo: string
  location: {
    city: string
    country: string
  }
  style: {
    [key: string]: string
  }
}

export interface ResumeExperience {
  company: number
  name: TranslatedValue
  description: TranslatedValue
  date: DatePeriod
  technologies: number[]
}

export interface ResumePosition {
  name: TranslatedValue
  description: TranslatedValue
  date: DatePeriod
  technologies: ResumeTechnology[]
}

export interface ResumeExperienceMapped {
  company: ResumeCompany
  positions: ResumePosition[]
}

export interface ResumeAboutLink {
  key: string
  name: string
  value: string
}

export interface ResumeAbout {
  name: string
  email: string
  phone: string
  links: ResumeAboutLink[]
}

export type ResumePDFFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000

export interface ResumePDFFontSrc {
  font: string
  weight: ResumePDFFontWeight
  style?: 'normal' | 'italic'
  format?: 'truetype' | string
}

export interface ResumePDFFontFace {
  family: string
  url: string
  src: ResumePDFFontSrc[]
}
