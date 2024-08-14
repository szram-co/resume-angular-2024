import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumeTechnologyItemComponent } from './resume-technology-item.component'

describe('ResumeTechnologyItemComponent', () => {
  let component: ResumeTechnologyItemComponent
  let fixture: ComponentFixture<ResumeTechnologyItemComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTechnologyItemComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumeTechnologyItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
