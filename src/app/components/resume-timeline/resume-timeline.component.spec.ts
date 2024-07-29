import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumeTimelineComponent } from './resume-timeline.component'

describe('ResumeTimelineComponent', () => {
  let component: ResumeTimelineComponent
  let fixture: ComponentFixture<ResumeTimelineComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTimelineComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumeTimelineComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
