import { Component, OnDestroy, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'
import { Router } from '@angular/router'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [NgForOf, TranslateModule, NgIf, NgClass, NgStyle],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent extends AppDestroy implements OnInit, OnDestroy {
  isReady = false
  about!: ResumeAbout

  constructor(
    private router: Router,
    private dataService: DataService
  ) {
    super()
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

  async downloadPDF(event: MouseEvent) {
    event.preventDefault()
    this.dataService.downloadResume$.emit(true)
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
