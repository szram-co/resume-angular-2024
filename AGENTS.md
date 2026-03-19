# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src/`. Main Angular entry points are `src/main.ts`, `src/app/app.config.ts`, and `src/app/app.routes.ts`. Feature UI is split into reusable components under `src/app/components`, route-level pages under `src/app/pages`, and shared logic in `src/app/services`, `src/app/directives`, and `src/app/guards`. Static content is stored in `src/assets`, especially `src/assets/data` for resume JSON, `src/assets/i18n` for translations, and `src/assets/images` and `src/assets/fonts` for media. Global SCSS lives in `src/styles.scss` and `src/scss/`.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

- `npm start`: runs `ng serve --host 0.0.0.0 --port 4200` for local development.
- `npm run build`: creates a production build in `dist/resume-angular-2024`.
- `npm run watch`: rebuilds in development mode on file changes.
- `npm test`: runs unit tests with Karma.

Use the Angular CLI directly for one-off tasks, for example `npx ng generate component components/example`.

## Coding Style & Naming Conventions
Use 2-space indentation, single quotes, no semicolons, `printWidth: 100`, and no trailing commas, matching `.prettierrc.json`. Prefer SCSS for component styles. Follow Angular naming conventions: kebab-case file names such as `resume-profile.component.ts`, PascalCase class names, and suffixes like `.component.ts`, `.service.ts`, `.guard.ts`, and `.directive.ts`. Keep components focused and place nested feature parts close to their parent, as in `src/app/components/resume-profile/components/`.

## AI Agent Notes
Repository-level guidance lives in this file. Detailed AI instructions are grouped in `.ai/`:

- `.ai/angular.instructions.md`: Angular architecture, component, routing, state, and testing rules
- `.ai/scss.instructions.md`: SCSS conventions based on Bootstrap mixins, local Sass tokens, and the `resume-*` naming pattern

## Testing Guidelines
Unit tests use Jasmine with Karma via Angular’s `@angular/build:karma` builder. Place specs next to the code they cover and use the `*.spec.ts` suffix, for example `lang.guard.spec.ts` or `pdf.component.spec.ts`. Add or update tests for changed services, guards, directives, and component behavior. Run `npm test` before opening a PR; no explicit coverage threshold is configured, so aim to cover the modified path and edge cases.

## Commit & Pull Request Guidelines
Recent history uses short, imperative commit messages such as `Refactor resume profile...`, `Update download button class...`, and `Remove unnecessary font size class...`. Keep that style: one clear action per commit, focused on behavior or structure. PRs should include a concise summary, affected screens or flows, linked issues when available, and screenshots for UI changes. Mention changes to `src/assets/data/*.json` or translation files explicitly, since they alter visible content.
