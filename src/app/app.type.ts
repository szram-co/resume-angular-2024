import { SafeHtml } from '@angular/platform-browser'
import type { SimpleIcon } from 'simple-icons'

export enum ResumeThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface TranslatedValue<T = string> {
  pl: T
  en: T
}

export interface DatePeriod<T = string> {
  from: T
  to: T | 'present'
}

export enum ResumeTechnologyType {
  language = 'language',
  framework = 'framework',
  preprocessor = 'preprocessor',
  frontend = 'frontend',
  web = 'web',
  library = 'library',
  cms = 'cms',
  tool = 'tool',
  design = 'design',
  system = 'system',
  methodology = 'methodology'
}

export enum ResumeTechnologyGroup {
  frontend = 'frontend',
  backend = 'backend'
}

export interface ResumeTechnologySafeIcon extends SimpleIcon {
  html: SafeHtml
}

export interface ResumeTechnology {
  id: number
  name: string
  type: ResumeTechnologyType
  group: ResumeTechnologyGroup
  leading?: boolean
  icon?: string
}

export type ResumeTechnologyWithIcon = MakeRequired<ResumeTechnology, 'icon'>

export type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>

export interface ResumeMappedCompany {
  company: ResumeCompany
  months: number
}

export interface ResumeTechnologyMapped extends ResumeTechnology {
  experience: {
    months: number
    score: number
    data: {
      [key: string]: any
    }
  }
  companies: ResumeMappedCompany[]
}

export interface ResumeCompany {
  id: number
  name: string
  companyLogo: string
  companyLogoContent: SafeHtml
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
  short_description: TranslatedValue
  date: DatePeriod
  technologies: number[]
}

export interface ResumePosition {
  name: TranslatedValue
  description: TranslatedValue
  short_description: TranslatedValue
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
