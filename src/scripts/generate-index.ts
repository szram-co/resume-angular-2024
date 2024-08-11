import * as fs from 'fs'
import * as path from 'path'

// Ścieżki do plików
const distPath = path.join(__dirname, `../../../dist/resume-angular-2024/server`)
const indexFilePath = path.join(distPath, 'index.server.html')

const PAGE_URL = 'https://resume.szram.co/'
const TRANSLATE = {
  pl: {
    PAGE_TITLE: 'Patryk Szram Portfolio - Senior Frontend Developer',
    PAGE_DESCRIPTION: 'Witaj, jestem Patryk Szram, a to jest moje wirtualne portfolio.'
  },
  en: {
    PAGE_TITLE: 'Patryk Szram Portfolio - Senior Frontend Developer',
    PAGE_DESCRIPTION: "Hello, i'm Patryk Szram and that site is my virtual portfolio."
  }
}

const createIndex = (lang: 'pl' | 'en') => {
  // Przeczytaj zawartość index.server.html
  let indexContent = fs.readFileSync(indexFilePath, 'utf8')

  // Zastąp placeholdery wartościami z tłumaczeń i environment
  indexContent = indexContent
    .replace(/\[PAGE_TITLE\]/g, TRANSLATE[lang].PAGE_TITLE)
    .replace(/\[PAGE_DESCRIPTION\]/g, TRANSLATE[lang].PAGE_DESCRIPTION)
    .replace(/\[PAGE_URL\]/g, PAGE_URL)
    .replace(/\[PAGE_IMAGE\]/g, `${PAGE_URL}assets/images/szram-share-image-${lang}.png`)

  // Zapisz zmodyfikowany plik jako index.{lang}.server.html
  fs.writeFileSync(path.join(distPath, `index.${lang}.server.html`), indexContent, 'utf8')

  console.log(`Generated index.${lang}.server.html`)
}

createIndex('pl')
createIndex('en')
