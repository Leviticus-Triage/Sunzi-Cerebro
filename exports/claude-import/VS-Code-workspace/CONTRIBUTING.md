# Contributing to Sunzi-Cerebro

Vielen Dank, dass du zum Projekt beitragen möchtest! Diese Datei beschreibt den empfohlenen Workflow, Code-Standards und wie du Issues oder PRs erstellst.

## Verhaltenskodex

Dieses Projekt folgt einem Verhaltenskodex. Bitte verhalte dich respektvoll und konstruktiv. Toxisches Verhalten wird nicht toleriert.

## Wie du beitragen kannst

- Fehler melden: Öffne ein Issue mit einer klaren Beschreibung, Reproduktionsschritten und relevanten Logs.
- Feature-Vorschläge: Öffne ein Issue mit Motivation und Akzeptanzkriterien.
- PRs: Erstelle einen Fork, erstelle einen Branch (`feat/...`, `fix/...`, `chore/...`) und pushe deine Änderungen.

## Workflow

1. Fork & Clone

```bash
git clone git@github.com:<your-user>/sunzi-cerebro.git
cd sunzi-cerebro
```

2. Branch erstellen

```bash
git checkout -b feat/my-feature
```

3. Arbeit lokal testen

```bash
npm install
npm run dev
npm test
```

4. PR öffnen

- Zielbranch: `main` oder `develop` je nach Repository-Richtlinie
- PR-Beschreibung: Motivation, Änderungen, Tests, Screenshots

## Code-Standards

- TypeScript: strikte Typisierung bevorzugt
- Linter: ESLint (wenn konfiguriert) - bitte `npm run lint` vor dem PR
- Formatierung: Prettier (falls vorhanden)

## Tests

- Schreibe Unit-Tests für neue Logik.
- Komponenten-Tests mit React Testing Library.
- CI läuft Unit Tests automatisch.

## Sicherheits- und Geheimnis-Handling

- Keine Geheimnisse (API-Keys, Passwörter) in Commits.
- Nutze GitHub Secrets für CI/CD.

## Release- und Changelog-Prozess

- Releases werden durch Tag-Push (`vX.Y.Z`) ausgelöst.
- Changelog-Generierung: Automatisch vom Release-Workflow (falls konfiguriert).

## Kontakt

Bei Fragen oder Unsicherheiten erstelle ein Issue oder kontaktiere die Maintainer via GitHub.
