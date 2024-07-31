import { Component, HostListener, OnInit } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { NgClass, NgForOf, NgIf, NgStyle } from '@angular/common'
import { DataService } from '../../services/data.service'
import { ResumeAboutLink } from '../../app.type'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-header',
  standalone: true,
  imports: [NgIf, NgClass, NgForOf, NgStyle],
  templateUrl: './resume-header.component.html',
  styleUrl: './resume-header.component.scss'
})
export class ResumeHeaderComponent extends AppDestroy implements OnInit {
  links!: ResumeAboutLink[]
  isScrolled: boolean = false

  constructor(
    private translate: TranslateService,
    private dataService: DataService
  ) {
    super()
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 1
  }

  ngOnInit() {
    this.dataService
      .getAbout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.links = data.links
      })
  }

  changeLanguage(language: string) {
    this.translate.use(language)
  }

  getCurrentLanguage() {
    return this.translate.currentLang
  }
}
