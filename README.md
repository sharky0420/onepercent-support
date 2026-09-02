# onepercent Support & Datenschutz

Öffentliche, vollständig statische Begleitwebsite für onepercent. Sie enthält die
Startseite, Hilfe, Datenschutzinformationen und eine eigene 404-Seite. Die
Inhalte dokumentieren auch die DE/EN-App, FREE/PRO-Grenzen, Rewards sowie die
technischen Grenzen von Schulrichtlinien, Store-Verifikation und Apples
Shield-Handoff. Für den Betrieb werden weder Server-Code noch eine Datenbank
benötigt.

## Voraussetzungen

- Node.js 22.13 oder neuer

## Lokal prüfen

```bash
npm ci
npm run check
```

`npm run build` erzeugt die veröffentlichungsfertige Website unter `docs/`.
Vor jedem Build werden Header-/Footer-Logo, Favicon und Open-Graph-Grafik
ausschließlich aus dem im Repository versionierten offiziellen
`assets/branding/onepercent_logo.png` erzeugt. Danach kopiert der Build die
gemeinsamen Assets, erzeugt alle HTML-Routen und schreibt `robots.txt`,
`sitemap.xml`, `.nojekyll` sowie den 404-Fallback.

`npm run release:copy` erstellt zusätzlich eine vollständig materialisierte
Release-Kopie samt SHA-256-Manifest unter
`/Users/eliaslanez/Library/Caches/onepercent-support-release`. Dieser Pfad liegt
außerhalb des iCloud-synchronisierten Desktop-Ordners.

Die Standardadresse ist:

```text
https://sharky0420.github.io/onepercent-support/
```

Der Pfad ist der bestehende, erreichbare GitHub-Pages-Repository-Slug.

Falls das Repository oder die Domain später geändert wird, muss die öffentliche
Basisadresse beim Build gesetzt werden:

```bash
ONEPERCENT_SITE_URL=https://example.com npm run build
```

## GitHub Pages aktivieren

Nach dem Commit und Push im GitHub-Repository unter **Settings → Pages** als
Quelle **Deploy from a branch** wählen und den Ordner **/docs** auf dem
gewünschten Branch auswählen. Danach `npm run check` erneut ausführen und den
veröffentlichten Link in App Store Connect als Support- und Datenschutz-URL
eintragen:

- Support: `/support/`
- Datenschutz: `/privacy/`

## Struktur

- `scripts/build-static-site.mjs`: statischer Seitengenerator und Inhalte
- `scripts/create-release-copy.mjs`: reproduzierbare lokale Release-Kopie
- `src/site.css`: gemeinsames responsives Design
- `public/`: reproduzierbar erzeugte Webvarianten des offiziellen 1%-Logos
- `docs/`: direkt von GitHub Pages auslieferbare Ausgabe
- `tests/static-site.test.mjs`: HTML-, Link-, Metadaten- und Inhaltsprüfungen

Die Website bindet keine Analyse-, Werbe- oder Tracking-Skripte ein.
