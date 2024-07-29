import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumeProfileComponent } from './resume-profile.component'

describe('ResumeProfileComponent', () => {
  let component: ResumeProfileComponent
  let fixture: ComponentFixture<ResumeProfileComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeProfileComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumeProfileComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
