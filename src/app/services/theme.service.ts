import { Injectable } from '@angular/core'
import { ResumeThemeMode } from '../app.type'

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly THEME_MODE_KEY_NAME = 'resume-theme'
  readonly THEME_ATTRIBUTE = 'data-bs-theme'

  themeDefault: ResumeThemeMode = ResumeThemeMode.DARK

  constructor() {
    this.themeInitialize()
  }

  get themeStored(): ResumeThemeMode | null {
    return localStorage.getItem(this.THEME_MODE_KEY_NAME) as ResumeThemeMode | null
  }

  set themeStored(theme: ResumeThemeMode) {
    localStorage.setItem(this.THEME_MODE_KEY_NAME, theme)
  }

  get themeAttribute(): ResumeThemeMode | null {
    return document.documentElement.getAttribute(this.THEME_ATTRIBUTE) as ResumeThemeMode | null
  }

  set themeAttribute(theme: ResumeThemeMode) {
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, theme.toString())
  }

  get themePreferred(): ResumeThemeMode | null {
    if (this.themeStored) {
      return this.themeStored as ResumeThemeMode
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return ResumeThemeMode.DARK
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return ResumeThemeMode.LIGHT
    } else {
      return this.themeDefault
    }
  }

  get isDark() {
    return this.themeAttribute === ResumeThemeMode.DARK
  }

  get isLight() {
    return this.themeAttribute === ResumeThemeMode.LIGHT
  }

  themeUpdate(theme: ResumeThemeMode) {
    if (this.themeAttribute === theme) return

    const root = document.documentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    root.classList.add('theme-switching')

    this.themeAttribute = theme
    this.themeStored = theme

    setTimeout(() => {
      root.classList.remove('theme-switching')
    }, reduceMotion ? 40 : 260)
  }

  themeInitialize() {
    const preferredTheme = this.themePreferred

    if (preferredTheme !== null) {
      this.themeUpdate(preferredTheme)
    }
  }

  themeToggle() {
    const newTheme =
      this.themeAttribute === ResumeThemeMode.DARK ? ResumeThemeMode.LIGHT : ResumeThemeMode.DARK
    this.themeUpdate(newTheme)
  }
}
