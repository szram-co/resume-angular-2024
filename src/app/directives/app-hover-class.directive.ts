import { Directive, ElementRef, HostListener, input, Renderer2 } from '@angular/core'

@Directive({
  selector: '[appHoverClass]',
  standalone: true
})
export class AppHoverClassDirective {
  readonly hoverClass = input('', { alias: 'appHoverClass' })

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.addClass(this.el.nativeElement, this.hoverClass())
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeClass(this.el.nativeElement, this.hoverClass())
  }
}
