# resume-angular-2024

Modern resume / portfolio built with Angular 21. The app renders a multilingual CV from JSON data, supports dark and light themes, and can generate downloadable PDF versions.

## Features

- Angular 21 standalone application
- language-based routing: `/:lang` and `/:lang/pdf`
- translations with `@ngx-translate/core`
- dark / light theme with persisted preference
- PDF generation with `pdfmake`
- JSON-driven content from `src/assets/data`

## Tech Stack

- Angular 21
- RxJS
- Bootstrap 5
- SCSS
- `@ngx-translate/core`
- `pdfmake`

## Requirements

- Node.js 20+
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app runs at `http://localhost:4200`.

## Available Scripts

```bash
npm start
npm run build
npm run watch
npm test
```

## Routes

- `/pl`
- `/en`
- `/pl/pdf`
- `/en/pdf`

Redirects:

- `/` -> `/pl`
- `/pdf` -> `/pl/pdf`
- unknown routes -> `/pl`

## Project Structure

```text
src/
  app/
    components/   reusable resume UI
    pages/web/    main web view
    pages/pdf/    PDF generation and preview
    services/     data, language, theme, SVG helpers
    app.config.ts
    app.routes.ts
    app.type.ts
  assets/
    data/         resume content
    i18n/         translations
    images/       images, logos, share assets
    fonts/        fonts used in UI and PDF
  scss/           shared variables and mixins
  styles.scss     global styles and theme tokens
```

## Data Files

The app uses:

- `src/assets/data/about.json`
- `src/assets/data/companies.json`
- `src/assets/data/experience.json`
- `src/assets/data/recommendations.json`
- `src/assets/data/technologies.json`

Data contracts are defined in `src/app/app.type.ts`.

## Translations

Translation files:

- `src/assets/i18n/pl.json`
- `src/assets/i18n/en.json`

Configured in `src/app/app.config.ts` via `TranslateHttpLoader`.

## Themes

The app supports `dark` and `light` modes.

- theme is applied through `data-bs-theme`
- selected mode is stored in `localStorage` under `resume-theme`
- system color preference is used on first load

Theme tokens and gradients live in:

- `src/scss/_variables.scss`
- `src/scss/_mixins.scss`
- `src/styles.scss`

## PDF

PDF generation is implemented in `src/app/pages/pdf/pdf.component.ts`.

- data and assets are loaded asynchronously
- fonts are embedded from `src/assets/fonts`
- output supports in-browser preview and file download

Generated files are language-specific, for example:

- `resume-szram-pl.pdf`
- `resume-szram-en.pdf`

## Notes

- the app uses `provideHttpClient(withFetch())`
- bootstrap is configured without `NgModule`
- `pdfmake` is listed in `allowedCommonJsDependencies` in `angular.json`

## License

MIT
