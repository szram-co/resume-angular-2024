# ResumeAngular2024

This project is an Angular application designed to manage and display professional experience and skills using data from JSON files.

## Table of Contents

- [About](#about)
- [JSON Data](#json-data)
- [Installation](#installation)
- [Development Server](#development-server)
- [Build](#build)
- [Fonts](#fonts)
- [License](#license)

## About

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.3. It serves as a portfolio to showcase various frontend development skills and experiences.

## JSON Data

The application uses four primary JSON files to manage data:

### about.json

This file contains general information about the user.

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+123456789",
  "links": [
    {
      "key": "github",
      "name": "GitHub",
      "value": "https://github.com/johndoe/"
    },
    {
      "key": "linkedin",
      "name": "LinkedIn",
      "value": "https://www.linkedin.com/in/johndoe/"
    }
  ]
}
```

### companies.json

This file contains information about the companies where the user has worked.

```json
[
  {
    "id": 1,
    "name": "Example Company",
    "companyLogo": "logo-example.svg",
    "location": {
      "city": "Example City",
      "country": "Example Country"
    },
    "style": {
      "--company-logo-bg": "#ffffff",
      "--company-logo-color": "#000000",
      "--company-dot": "#000000"
    }
  }
]
```

### technologies.json

This file contains details about the technologies the user has experience with.

```json
[
  {
    "id": 1,
    "name": "Angular",
    "skillAssessment": true,
    "type": "framework",
    "group": "frontend"
  },
  {
    "id": 2,
    "name": "TypeScript",
    "skillAssessment": true,
    "type": "language",
    "group": "frontend"
  }
]
```

### experience.json

This file contains information about the user's professional experience.

```json
[
  {
    "company": 1,
    "name": {
      "pl": "Frontend Developer",
      "en": "Frontend Developer"
    },
    "description": {
      "pl": "Pracowałem jako Frontend Developer w Example Company.",
      "en": "Worked as a Frontend Developer at Example Company."
    },
    "date": {
      "from": "2020-01-01",
      "to": "2022-12-31"
    },
    "technologies": [
      1,
      2
    ]
    // List of technology IDs from technologies.json
  }
]
```

## Installation

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/szram-co/resume-angular-2024.git

# Go into the repository
$ cd resume-angular-2024

# Install dependencies
$ npm install
```

## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Fonts

### Adding Fonts to the Project

To include custom fonts in your project, follow these steps:

1. **Place Font Files**: Put your font files in the appropriate directory within your project, maintaining the structure as shown below:

```
assets
└── fonts
    ├── Mulish
    │   ├── Mulish-Black.ttf
    │   ├── Mulish-BlackItalic.ttf
    │   ├── Mulish-Bold.ttf
    │   ├── ...
    ├── Poppins
    │   ├── Poppins-Black.ttf
    │   ├── Poppins-BlackItalic.ttf
    │   ├── Poppins-Bold.ttf
    │   ├── ...
    └── SairaSemiCondensed
        ├── SairaSemiCondensed-Bold.ttf
        ├── SairaSemiCondensed-Medium.ttf
        ├── ...
```

2. **SCSS Setup**: Use the `addFontFace` mixin to generate the `@font-face` rules for your fonts. Here's an example:

```scss
@include addFontFace(
    (
      family: 'Poppins',
      url: '/assets/fonts/Poppins/',
      src: (
        (font: 'Poppins-Black.ttf', weight: 900, style: normal),
        (font: 'Poppins-BlackItalic.ttf', weight: 900, style: italic),
        (font: 'Poppins-ExtraBold.ttf', weight: 800, style: normal),
        (font: 'Poppins-ExtraBoldItalic.ttf', weight: 800, style: italic), // Add other font styles as needed
      )
    )
);
```

3. **Angular Component Configuration**: Ensure you add the fonts in the `resume-pdf.component.ts` to enable seamless PDF generation:

```typescript
get fontFaces(): HTMLFontFace[] {
  const addFontFace = (font: ResumePDFFontFace) => {
    return font.src.map((src) => {
      return {
        src: [
          {
            url: `${font.url}${src.font}`,
            format: src?.format ?? 'truetype'
          }
        ],
        family: font.family,
        style: src?.style ?? 'normal',
        weight: src.weight
      } as HTMLFontFace;
    });
  };

  return [
    ...addFontFace({
      family: 'Mulish',
      url: '/assets/fonts/Mulish/static/',
      src: [
        { font: 'Mulish-Black.ttf', weight: 900 },
        { font: 'Mulish-ExtraBold.ttf', weight: 800 },
        { font: 'Mulish-Bold.ttf', weight: 700 },
        // Add other font styles as needed
      ]
    }),
    ...addFontFace({
      family: 'Poppins',
      url: '/assets/fonts/Poppins/',
      src: [
        { font: 'Poppins-Black.ttf', weight: 900 },
        { font: 'Poppins-BlackItalic.ttf', weight: 900, style: 'italic' },
        { font: 'Poppins-ExtraBold.ttf', weight: 800 },
        // Add other font styles as needed
      ]
    })
  ];
}

// Setup fonts in jsPDF
async downloadPDF() {
  this.pdf = new jsPDF()

  this.pdf.html(contentHTML, {
    fontFaces: this.fontFaces,
    callback: (doc) => {
      doc.save(this.filename)
    }
  })
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
