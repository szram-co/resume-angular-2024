---
applyTo:
  - "src/**/*.scss"
---

# SCSS Instructions

You are responsible for maintainable SCSS in this repository. Write new styles and refactor old ones to match the project’s Bootstrap-based architecture, local Sass variables, and component-scoped styling.

## Repository Context

- Global styling starts in `src/styles.scss`.
- Shared Sass entrypoint is `@use 'app' as *;` from `src/scss/app.scss`.
- Design tokens in this repo come from `src/scss/_variables.scss` and CSS custom properties declared in `src/styles.scss`.
- Bootstrap mixins and utilities are available through the shared `app` import.
- Current custom breakpoints are:
  - `sm: 576px`
  - `md: 768px`
  - `lg: 992px`
  - `xl: 1300px`
  - `xxl: 1500px`

## Core Rules

### 1. Naming and Scope

- Prefer component-scoped class names with the existing `resume-*` convention.
- Use BEM where it fits naturally: `.resume-header`, `.resume-header__background`, `.resume-header--ready`.
- Do not style by ID.
- Avoid styling raw tags in component styles unless they are clearly local and nested under the component block.

### 2. Tokens and Values

- Prefer existing Sass variables such as `$color-brand`, `$color-brand-dark`, `$font-head`, `$font-text-size`, and Bootstrap variables exposed through `app`.
- Prefer existing CSS custom properties like `var(--bs-body-color)`, `var(--bs-body-bg)`, `var(--bs-gradient)`, and `var(--resume-transition-speed)`.
- Do not introduce new hardcoded colors or spacing if an existing repo token already covers the need.
- Use `rem` for spacing and typography. Keep `line-height` unitless unless a mixin already defines the pattern.

### 3. Responsive Rules

- Use Bootstrap breakpoint mixins from the shared `app` import.
- Do not write raw `@media` queries when `media-breakpoint-up()` or `media-breakpoint-down()` can express the same rule.
- For new code, prefer mobile-first styling with `media-breakpoint-up(md)` and above.
- When editing older tablet-first code, improve it incrementally instead of rewriting unrelated layout logic.

### 4. Selector Strategy

- Keep nesting shallow, ideally no deeper than 3 levels.
- Avoid selectors that depend on another component’s internal DOM shape.
- Prefer explicit element classes over chains like `.parent .child .button`.
- Avoid `!important` unless you explain why it is unavoidable.

### 5. Organization and Reuse

- Group properties in a predictable order: layout, visual, typography, interaction.
- Reuse existing mixins such as `@include transitions(...)`, Bootstrap spacing helpers, and Bootstrap typography utilities where appropriate.
- If the same group of declarations appears repeatedly, extract a mixin or shared utility in `src/scss/`.
- Add comments only for non-obvious workarounds or browser-specific behavior.

### 6. Accessibility and Motion

- Always style keyboard focus with `:focus-visible` for interactive elements.
- Preserve contrast in both light and dark themes.
- Respect `prefers-reduced-motion` when adding animations or transitions.
- Prefer logical properties (`padding-inline`, `margin-inline`, `inset-inline`) for new directional styles.

## Review Mode

- Treat deep nesting, magic numbers, duplicated gradients, and raw hex values as maintainability bugs.
- Propose a cleaned-up SCSS version first, then explain the main decisions briefly.

## Quick Checklist

- `@use 'app' as *;` in component SCSS when shared tokens/mixins are needed
- Existing repo tokens before new values
- Bootstrap breakpoint mixins, not raw media queries
- Shallow nesting and `resume-*` / BEM naming
- Accessible focus and reduced-motion support
