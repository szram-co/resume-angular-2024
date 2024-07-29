import { Component, OnInit } from '@angular/core'
import { NgClass, NgForOf, NgIf } from '@angular/common'
import { TranslateModule } from '@ngx-translate/core'
import { ResumeAbout } from '../../app.type'
import { DataService } from '../../services/data.service'

@Component({
  selector: 'app-resume-profile',
  standalone: true,
  imports: [NgForOf, TranslateModule, NgIf, NgClass],
  templateUrl: './resume-profile.component.html',
  styleUrl: './resume-profile.component.scss'
})
export class ResumeProfileComponent implements OnInit {
  about!: ResumeAbout

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getAbout().subscribe((data) => {
      this.about = data
    })
  }
}
