import { Routes } from '@angular/router'
import { WebComponent } from './pages/web/web.component'
import { langGuard } from './guards/lang.guard'

export const routes: Routes = [
  {
    path: ':lang',
    component: WebComponent,
    canActivate: [langGuard],
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: '/pl',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/pl'
  }
]
