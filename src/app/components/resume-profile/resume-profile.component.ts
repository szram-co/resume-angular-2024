import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { debounceTime, fromEvent, switchMap, takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [NgForOf, TranslateModule, NgIf, NgClass, NgStyle],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent
  extends AppDestroy
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild('pictureContainer', { static: false }) pictureContainer!: ElementRef<HTMLDivElement>
  @Input() view: 'web' | 'pdf' = 'web'

  isReady = false
  about!: ResumeAbout
  profileImageSize!: { [key: string]: string }

  constructor(
    private translate: TranslateService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    super()
  }

  ngOnInit() {
    this.dataService
      .getAbout()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((data) => {
          this.about = data
          this.isReady = true
          this.updateProfileImageSize()
          return this.translate.onLangChange.pipe(takeUntil(this.destroy$))
        }),
        switchMap(() => {
          this.updateProfileImageSize()
          return fromEvent(window, 'resize').pipe(debounceTime(50), takeUntil(this.destroy$))
        })
      )
      .subscribe(() => {
        this.updateProfileImageSize()
      })
  }

  ngAfterViewChecked() {
    this.updateProfileImageSize()
  }

  get isViewPDF() {
    return this.view === 'pdf'
  }

  updateProfileImageSize() {
    if (!this.isReady) return

    if (this.pictureContainer) {
      const containerRect = this.pictureContainer.nativeElement.getBoundingClientRect()
      this.profileImageSize = {
        height: containerRect.height + 'px'
      }
      this.cdr.detectChanges() // Trigger change detection manually
    }
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
