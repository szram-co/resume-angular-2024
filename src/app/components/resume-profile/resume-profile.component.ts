import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'
import { RouterLink } from '@angular/router'
import { ResumeProfileHelloComponent } from './components/resume-profile-hello/resume-profile-hello.component'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [
    NgForOf,
    TranslateModule,
    NgIf,
    NgClass,
    NgStyle,
    RouterLink,
    ResumeProfileHelloComponent
  ],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent extends AppDestroy implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('resumeProfile', { static: false }) resumeProfile!: ElementRef<HTMLDivElement>

  isReady = false
  about!: ResumeAbout

  backgroundImageLoaded: boolean = false
  backgroundImageUrl: string = '/assets/images/profile-image.jpg'

  constructor(
    private cdr: ChangeDetectorRef,
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

  ngAfterViewInit() {
    this.checkIfBackgroundImageLoaded()
  }

  checkIfBackgroundImageLoaded() {
    const img = new Image()
    img.src = this.backgroundImageUrl

    img.onload = () => {
      this.backgroundImageLoaded = true
      this.applyBackgroundImage()
    }

    img.onerror = () => {
      console.error('Failed to load background image')
    }
  }

  applyBackgroundImage() {
    this.cdr.detectChanges()

    this.resumeProfile.nativeElement.style.backgroundImage = `url(${this.backgroundImageUrl})`
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
