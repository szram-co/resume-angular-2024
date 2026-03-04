import { Component, computed, effect, input, signal } from '@angular/core'
import { ResumeTechnologyWithIcon } from '../../../../app.type'
import { NgClass } from '@angular/common'

@Component({
  selector: 'app-resume-technology-item',
  imports: [NgClass],
  templateUrl: './resume-technology-item.component.html',
  styleUrl: './resume-technology-item.component.scss'
})
export class ResumeTechnologyItemComponent {
  readonly technology = input<ResumeTechnologyWithIcon | null>(null)
  readonly isIconLoaded = signal(false)
  readonly hasIconError = signal(false)
  readonly ICON_URL = 'https://cdn.simpleicons.org'
  readonly ICON_COLOR = '#7a7a7a'
  readonly iconSrc = computed(() => {
    const resolvedIconSlug = this.resolvedIconSlug()

    if (!resolvedIconSlug) {
      return null
    }

    return `${this.ICON_URL}/${resolvedIconSlug}/${this.ICON_COLOR.replace('#', '')}`
  })
  readonly fallbackLabel = computed(() => this.technology()?.name?.slice(0, 1).toUpperCase() ?? '?')
  private readonly iconAliases: Record<string, string> = {
    css3: 'css'
  }
  readonly resolvedIconSlug = computed(() => {
    const rawSlug = this.technology()?.icon
    if (!rawSlug) {
      return null
    }

    return this.iconAliases[rawSlug] ?? rawSlug
  })
  private readonly blockedIconSlugs = new Set(['adobeillustrator', 'adobephotoshop'])

  constructor() {
    effect((onCleanup) => {
      this.isIconLoaded.set(false)
      this.hasIconError.set(false)

      const technology = this.technology()
      const resolvedIconSlug = this.resolvedIconSlug()
      const iconSrc = this.iconSrc()

      if (!technology) {
        return
      }

      if (!resolvedIconSlug || this.blockedIconSlugs.has(resolvedIconSlug) || !iconSrc) {
        this.hasIconError.set(true)
        this.isIconLoaded.set(true)
        return
      }

      const icon = new Image()
      let isCurrent = true

      onCleanup(() => {
        isCurrent = false
        icon.onload = null
        icon.onerror = null
      })

      icon.onload = () => {
        if (!isCurrent) {
          return
        }

        this.isIconLoaded.set(true)
      }

      icon.onerror = () => {
        if (!isCurrent) {
          return
        }

        this.hasIconError.set(true)
        this.isIconLoaded.set(true)
      }

      icon.src = iconSrc
    })
  }
}
