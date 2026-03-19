# resume-angular-2024

Modern resume / portfolio built with Angular 21 as a standalone application, with multilingual support, theme switching, and PDF generation.

## About

This project renders a resume website from JSON data stored in `src/assets/data`. The application currently supports two main modes:

- web view available at `/:lang`
- PDF generation available at `/:lang/pdf`

Currently supported languages:

- `pl`
- `en`

## Stack

- Angular 21
- standalone components and `ApplicationConfig`
- RxJS
- `@ngx-translate/core`
- Bootstrap 5 with custom SCSS tokens
- `pdfmake` for PDF generation

## Main Features

- language-based routing with a guard for `pl` and `en`
- resume view driven by JSON data
- dynamic translations from `src/assets/i18n`
- light mode / dark mode persisted in `localStorage`
- PDF generation and download
- lazy-loaded PDF route
- language-aware meta tags and social share images

## Requirements

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Running the Project

Development server:

```bash
npm start
```

By default, the application runs at:

```text
http://localhost:4200
```

Production build:

```bash
npm run build
```

Watch mode:

```bash
npm run watch
```

Tests:

```bash
npm test
```

## Routing

Defined routes:

- `/pl`
- `/en`
- `/pl/pdf`
- `/en/pdf`

Additional routing behavior:

- `/` redirects to `/pl`
- `/pdf` redirects to `/pl/pdf`
- unknown routes redirect to `/pl`

## Project Structure

Key directories and files:

- `src/app/app.config.ts` application and provider configuration
- `src/app/app.routes.ts` routing definition
- `src/app/components` resume UI components
- `src/app/pages/web` main web page
- `src/app/pages/pdf` PDF view and generation logic
- `src/app/services` data, language, theme, and SVG-related logic
- `src/assets/data` resume source data
- `src/assets/i18n` translations
- `src/assets/images` images, logos, and social share assets
- `src/assets/fonts` fonts used by the UI and PDF
- `src/scss` shared SCSS variables and mixins

## Data Sources

The project uses the following data files:

- `src/assets/data/about.json`
- `src/assets/data/companies.json`
- `src/assets/data/experience.json`
- `src/assets/data/recommendations.json`
- `src/assets/data/technologies.json`

Relationships between the files:

- `experience.json` references companies via `company`
- `experience.json` references technologies via the `technologies` array
- `companies.json` points to logo files via `companyLogo`
- `recommendations.json` points to author avatars via `author.avatar`

Current data types are defined in:

- `src/app/app.type.ts`

## Translations

Translation files are stored in:

- `src/assets/i18n/pl.json`
- `src/assets/i18n/en.json`

Translations are loaded through `TranslateHttpLoader` configured in `src/app/app.config.ts`.

## Themes

The application supports:

- `dark`
- `light`

Theme behavior:

- the active theme is applied through the `data-bs-theme` attribute on `documentElement`
- the selected theme is stored in `localStorage` under the `resume-theme` key
- system theme preferences are respected on first load

Global tokens and gradients are defined in:

- `src/scss/_variables.scss`
- `src/scss/_mixins.scss`
- `src/styles.scss`

## PDF

PDF generation is handled by:

- `src/app/pages/pdf/pdf.component.ts`

Current implementation details:

- uses `pdfmake`
- loads data and assets asynchronously
- embeds fonts from `src/assets/fonts`
- supports two output modes:
  - in-browser preview (`blob`)
  - file download (`file`)

Generated files are language-specific, for example:

- `resume-szram-pl.pdf`
- `resume-szram-en.pdf`

## Environments

Environment files:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

They are currently used mainly to build correct URLs for meta tags and social share assets.

## Technical Notes

- the application uses `provideHttpClient(withFetch())`
- routing and bootstrap are based on modern Angular setup without `NgModule`
- `pdfmake` is listed in `allowedCommonJsDependencies` in `angular.json` to keep the build output clean

## License

MIT
