import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumeTimelinePositionComponent } from './resume-timeline-position.component'

describe('ResumeTimelinePositionComponent', () => {
  let component: ResumeTimelinePositionComponent
  let fixture: ComponentFixture<ResumeTimelinePositionComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTimelinePositionComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumeTimelinePositionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
