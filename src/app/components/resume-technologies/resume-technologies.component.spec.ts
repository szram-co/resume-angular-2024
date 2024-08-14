import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumeTechnologiesComponent } from './resume-technologies.component'

describe('ResumeTechnologiesComponent', () => {
  let component: ResumeTechnologiesComponent
  let fixture: ComponentFixture<ResumeTechnologiesComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTechnologiesComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumeTechnologiesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
