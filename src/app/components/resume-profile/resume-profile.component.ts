import { Component, OnDestroy, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [NgForOf, TranslateModule, NgIf, NgClass, NgStyle, RouterLink],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent extends AppDestroy implements OnInit, OnDestroy {
  isReady = false
  about!: ResumeAbout

  profileImageWebP = 'assets/images/profile-image.webp'
  profileImageAvif = 'assets/images/profile-image.avif'
  profileImageJpg = 'assets/images/profile-image.jpg'

  constructor(
    private dataService: DataService,
    private translate: TranslateService
  ) {
    super()
  }

  get currentLanguage() {
    return this.translate.currentLang as 'pl' | 'en'
  }

  ngOnInit() {
    this.dataService
      .getAbout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.about = data
        this.isReady = true
      })
  }

  formatPhoneNumber(phone: string): string {
    const cleaned = ('' + phone).replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{3})$/)
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`
    }
    return phone
  }
}
