import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core'
import { ResumeTechnologyWithIcon } from '../../../../app.type'
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common'
import { AppDestroy } from '../../../../abstract/AppDestroy.abstract'

@Component({
  selector: 'app-resume-technology-item',
  standalone: true,
  imports: [NgForOf, NgIf, NgClass, NgOptimizedImage],
  templateUrl: './resume-technology-item.component.html',
  styleUrl: './resume-technology-item.component.scss'
})
export class ResumeTechnologyItemComponent extends AppDestroy implements AfterViewInit {
  @Input() technology: ResumeTechnologyWithIcon | null = null

  isIconLoaded = false

  readonly ICON_URL: string = 'https://cdn.simpleicons.org'
  readonly ICON_COLOR: string = '#7a7a7a'

  constructor(private cdr: ChangeDetectorRef) {
    super()
  }

  ngAfterViewInit() {
    this.loadIcon()
  }

  get iconSrc() {
    return `${this.ICON_URL}/${this.technology?.icon}/${this.ICON_COLOR.replace('#', '')}`
  }

  private loadIcon() {
    if (!this.technology) return

    const icon = new Image()
    icon.src = this.iconSrc

    icon.onload = () => {
      this.isIconLoaded = true
      this.cdr.detectChanges()
    }

    icon.onerror = () => {
      this.technology = null
      this.cdr.detectChanges()
      console.error('Failed to load background image')
    }
  }
}
