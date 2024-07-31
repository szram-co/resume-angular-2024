import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ResumePdfComponent } from './resume-pdf.component'

describe('ResumePdfComponent', () => {
  let component: ResumePdfComponent
  let fixture: ComponentFixture<ResumePdfComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumePdfComponent]
    }).compileComponents()

    fixture = TestBed.createComponent(ResumePdfComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
