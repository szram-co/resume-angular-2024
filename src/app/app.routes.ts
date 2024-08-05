import { Routes } from '@angular/router'
import { WebComponent } from './pages/web/web.component'
import { PdfComponent } from './pages/pdf/pdf.component'

export const routes: Routes = [
  {
    path: '',
    component: WebComponent
  },
  {
    path: 'download-pdf',
    component: PdfComponent
  }
]
