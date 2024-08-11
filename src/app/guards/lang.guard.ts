import { CanActivateFn, Router } from '@angular/router'
import { inject } from '@angular/core'

export const langGuard: CanActivateFn = (route, state) => {
  const lang = route.paramMap.get('lang')

  const isMath = lang !== null && ['pl', 'en'].includes(lang)

  if (!isMath) {
    const router = inject(Router)
    router.navigate(['/pl'])
  }

  return isMath
}
