import { Component, Input, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'
import { AppDestroy } from '../../abstract/AppDestroy.abstract'
import { takeUntil } from 'rxjs'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [NgForOf, TranslateModule, NgIf, NgClass],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent extends AppDestroy implements OnInit {
  @Input() view: string = ''

  about!: ResumeAbout

  constructor(private dataService: DataService) {
    super()
  }

  ngOnInit() {
    this.dataService
      .getAbout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.about = data
      })
  }

  get isViewPDF() {
    return this.view === 'pdf'
  }
}
