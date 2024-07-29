import { Component, OnInit } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { NgClass, NgForOf, NgIf } from '@angular/common'
import { DataService } from '../../services/data.service'
import { ResumeAboutLink } from '../../app.type'

@Component({
  selector: 'app-resume-header',
  standalone: true,
  imports: [NgIf, NgClass, NgForOf],
  templateUrl: './resume-header.component.html',
  styleUrl: './resume-header.component.scss'
})
export class ResumeHeaderComponent implements OnInit {
  links!: ResumeAboutLink[]

  constructor(
    private translate: TranslateService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.dataService.getAbout().subscribe((data) => {
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
