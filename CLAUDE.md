# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (localhost:4200)
npm start
# or
ng serve --host 0.0.0.0 --port 4200

# Production build (output: dist/resume-angular-2024)
ng build

# Watch build (development)
ng build --watch --configuration development

# Run tests
ng test

# Run a single test file
ng test --include='**/resume-technologies.component.spec.ts'
```

SCSS include paths are configured in `angular.json` — import from `src/scss/` using bare names (e.g., `@use 'variables'`).

## Architecture

This is a standalone Angular 21 SSR app (no NgModules). All components use the modern standalone component style.

### Routing & i18n

- Routes: `/:lang` (e.g., `/pl`, `/en`). Default redirects to `/pl`.
- Language guard (`src/app/guards/lang.guard.ts`) validates the lang param to `pl|en`.
- `WebComponent` handles language switching via `@ngx-translate/core` using `document.startViewTransition()`.
- Translation files: `src/assets/i18n/en.json`, `src/assets/i18n/pl.json`.
- Language preference is persisted in `localStorage` under key `LANG`.

### Data Flow

All resume data lives in JSON files at `src/assets/data/`:
- `about.json` — personal info and social links
- `companies.json` — company metadata and CSS custom property styling
- `experience.json` — work positions (references company IDs and technology IDs)
- `technologies.json` — technology list with type/group classification

`DataService` (`src/app/services/data.service.ts`) loads all four JSON files via HTTP, caches them with `shareReplay(1)`, and provides two combined observables:
- `getCombinedTechnologies()` — merges tech with experience months and a calculated score
- `getCombinedExperience()` — groups positions by company, sorted by recency

Company SVG logos are loaded as raw text and sanitized via `DomSanitizer.bypassSecurityTrustHtml()`.

### Pages

- `WebComponent` (`src/app/pages/web/`) — the main resume web view. Composes shared components.
- `PdfComponent` (`src/app/pages/pdf/`) — renders resume for PDF export via `jsPDF`. Triggered automatically on load; downloads the file. Note: the PDF page is not in the router — it's used as an internal utility component.

### Shared Components

All in `src/app/components/`:
- `resume-header` — top navigation/header
- `resume-profile` — hero section with animated hello SVG (`resume-profile-hello`)
- `resume-skills` — skills summary section
- `resume-technologies` — tech grid (`resume-technology-item` sub-component)
- `resume-timeline` — experience timeline (`resume-timeline-position` sub-component)

### Services

- `DataService` — data fetching and transformation
- `ThemeService` — dark/light mode via Bootstrap's `data-bs-theme` attribute on `<html>`; persists to `localStorage` under key `resume-theme`; defaults to dark
- `LanguageService` — wrapper around `TranslateService` with Polish pluralization logic
- `SvgLoaderService` — SVG loading helper

### Types

All shared types and enums are in `src/app/app.type.ts`. Key ones:
- `ResumeTechnologyType` / `ResumeTechnologyGroup` — enums for classifying technologies
- `TranslatedValue<T>` — `{ pl: T, en: T }` pattern used throughout for bilingual content
- `ResumeExperienceMapped` / `ResumeTechnologyMapped` — enriched types produced by `DataService`

### Styling

- Bootstrap 5 with full SCSS customization — variables overridden in `src/scss/_variables.scss`
- Custom breakpoints: `xl: 1300px`, `xxl: 1500px`
- Fonts: Poppins (base), Mulish (headings), Saira Semi Condensed (monospace/condensed)
- Global styles entry: `src/styles.scss`; shared partials in `src/scss/`
- Theme switching adds `.theme-switching` class to `<html>` briefly during transitions
- `transitions()` mixin in `_mixins.scss` uses CSS custom properties `--resume-transition-speed` and `--resume-transition-type`

### Angular Patterns

- Uses Angular signals (`signal`, `computed`, `effect`, `toSignal`) throughout — prefer signals over traditional RxJS subscriptions in components
- `afterNextRender()` used instead of `ngAfterViewInit` for browser-only side effects
- No NgModules; all providers declared in `src/app/app.config.ts`