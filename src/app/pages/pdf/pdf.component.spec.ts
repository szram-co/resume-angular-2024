import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { Observable, of } from 'rxjs'

import { PdfComponent } from './pdf.component'

class MockTranslateLoader implements TranslateLoader {
  getTranslation(): Observable<Record<string, unknown>> {
    return of({})
  }
}

describe('PdfComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PdfComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents()
  })

  it('should create', () => {
    const fixture = TestBed.createComponent(PdfComponent)
    const component = fixture.componentInstance
    expect(component).toBeTruthy()
  })
})
