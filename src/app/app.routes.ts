import { Routes } from '@angular/router'
import { ResumePdfComponent } from './components/resume-pdf/resume-pdf.component'

export const routes: Routes = [
  {
    path: 'download-pdf',
    component: ResumePdfComponent
  }
]
