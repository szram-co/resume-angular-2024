import { TestBed } from '@angular/core/testing'

import { SVGLoaderService } from './svgloader.service'

describe('SVGLoaderService', () => {
  let service: SVGLoaderService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(SVGLoaderService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
