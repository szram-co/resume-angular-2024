import { Component, computed, inject, signal } from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { ResumeProfileHelloComponent } from './components/resume-profile-hello/resume-profile-hello.component'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-resume-profile',
  imports: [TranslateModule, NgClass, NgStyle, ResumeProfileHelloComponent],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent {
  readonly backgroundImageLoaded = signal(false)
  readonly backgroundImageUrl = '/assets/images/profile-image.jpg'
  readonly backgroundImageStyle = computed(() =>
    this.backgroundImageLoaded() ? `url(${this.backgroundImageUrl})` : 'none'
  )
  private readonly dataService = inject(DataService)
  private readonly translate = inject(TranslateService)
  private readonly aboutData = toSignal(this.dataService.getAbout(), { initialValue: null })
  readonly isReady = computed(() => this.aboutData() !== null)
  readonly about = computed<ResumeAbout>(() => {
    return (
      this.aboutData() ?? {
        name: '',
        email: '',
        phone: '',
        links: []
      }
    )
  })

  constructor() {
    this.checkIfBackgroundImageLoaded()
  }

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = ('' + phone).replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{3})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
  }

  private checkIfBackgroundImageLoaded() {
    const img = new Image()
    img.src = this.backgroundImageUrl

    img.onload = () => {
      this.backgroundImageLoaded.set(true)
    }

    img.onerror = () => {
      console.error('Failed to load background image')
    }
  }
}
