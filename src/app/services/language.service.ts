import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  constructor(private translate: TranslateService) {}

  plural(key: string, count: number): string {
    const lang = this.translate.currentLang
    let pluralKey = 'OTHER'

    if (count === 1) pluralKey = 'ONE'

    if (lang === 'pl' && count >= 2 && count <= 4) pluralKey = 'TWO'

    return this.translate.instant(`${key}.${pluralKey}`, { count })
  }

  get(key: string) {
    return this.translate.instant(key)
  }
}
