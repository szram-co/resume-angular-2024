# resume-angular-2024

Nowoczesne CV / portfolio zbudowane w Angularze 21 jako aplikacja standalone, z obsługą wielu języków, przełączaniem motywu oraz generowaniem PDF.

## O projekcie

Projekt renderuje stronę CV na podstawie danych z plików JSON znajdujących się w `src/assets/data`. Aplikacja działa w dwóch głównych trybach:

- widok web pod adresami `/:lang`
- generowanie PDF pod adresami `/:lang/pdf`

Aktualnie wspierane języki:

- `pl`
- `en`

## Stack

- Angular 21
- standalone components i `ApplicationConfig`
- RxJS
- `@ngx-translate/core`
- Bootstrap 5 + własne SCSS tokens
- `pdfmake` do generowania PDF

## Najważniejsze funkcje

- routing językowy z guardem dla `pl` i `en`
- widok CV oparty o dane z JSON
- dynamiczne tłumaczenia z `src/assets/i18n`
- light mode / dark mode zapisywany w `localStorage`
- generowanie i pobieranie PDF
- osobny widok PDF ładowany lazy przez router
- meta tagi i grafiki social share zależne od języka

## Wymagania

- Node.js 20+
- npm

## Instalacja

```bash
npm install
```

## Uruchamianie

Serwer developerski:

```bash
npm start
```

Domyślnie aplikacja działa pod:

```text
http://localhost:4200
```

Build produkcyjny:

```bash
npm run build
```

Tryb watch:

```bash
npm run watch
```

Testy:

```bash
npm test
```

## Routing

Zdefiniowane ścieżki:

- `/pl`
- `/en`
- `/pl/pdf`
- `/en/pdf`

Dodatkowo:

- `/` przekierowuje do `/pl`
- `/pdf` przekierowuje do `/pl/pdf`
- nieznane adresy przekierowują do `/pl`

## Struktura projektu

Najważniejsze katalogi:

- `src/app/app.config.ts` konfiguracja aplikacji i providerów
- `src/app/app.routes.ts` routing
- `src/app/components` komponenty UI CV
- `src/app/pages/web` główny widok strony
- `src/app/pages/pdf` widok i logika generowania PDF
- `src/app/services` logika danych, języka, motywu i SVG
- `src/assets/data` źródło danych CV
- `src/assets/i18n` tłumaczenia
- `src/assets/images` obrazy, logotypy i assety social share
- `src/assets/fonts` fonty używane w UI i PDF
- `src/scss` współdzielone zmienne i mixiny SCSS

## Dane wejściowe

Projekt korzysta z następujących plików:

- `src/assets/data/about.json`
- `src/assets/data/companies.json`
- `src/assets/data/experience.json`
- `src/assets/data/recommendations.json`
- `src/assets/data/technologies.json`

Powiązania między danymi:

- `experience.json` referencjonuje firmy przez `company`
- `experience.json` referencjonuje technologie przez tablicę `technologies`
- `companies.json` wskazuje pliki logo przez `companyLogo`
- `recommendations.json` wskazuje avatary autorów przez `author.avatar`

Aktualne typy danych są opisane w:

- `src/app/app.type.ts`

## Tłumaczenia

Tłumaczenia znajdują się w:

- `src/assets/i18n/pl.json`
- `src/assets/i18n/en.json`

Ładowanie tłumaczeń jest skonfigurowane przez `TranslateHttpLoader` w `src/app/app.config.ts`.

## Motywy

Aplikacja obsługuje tryby:

- `dark`
- `light`

Motyw:

- jest ustawiany przez atrybut `data-bs-theme` na `documentElement`
- jest zapisywany w `localStorage` pod kluczem `resume-theme`
- respektuje preferencje systemowe przy pierwszym uruchomieniu

Globalne tokeny i gradienty są definiowane w:

- `src/scss/_variables.scss`
- `src/scss/_mixins.scss`
- `src/styles.scss`

## PDF

Generowanie PDF realizuje komponent:

- `src/app/pages/pdf/pdf.component.ts`

Obecna implementacja:

- używa `pdfmake`
- ładuje dane i assety asynchronicznie
- osadza fonty z `src/assets/fonts`
- wspiera dwa tryby wyjścia:
  - podgląd w przeglądarce (`blob`)
  - pobranie pliku (`file`)

Plik PDF jest generowany per język, np.:

- `resume-szram-pl.pdf`
- `resume-szram-en.pdf`

## Środowiska

Pliki środowisk:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Służą obecnie głównie do budowania poprawnych adresów URL dla meta tagów i assetów share image.

## Uwagi techniczne

- aplikacja używa `provideHttpClient(withFetch())`
- routing i konfiguracja są oparte o nowy bootstrap Angulara bez `NgModule`
- `pdfmake` jest dodane do `allowedCommonJsDependencies` w `angular.json`, żeby build był czysty

## Licencja

MIT
