# Sunzi-Cerebro

Starter-Template: Vite + React + TypeScript

## Badges

Bitte ersetze <owner> und <repo> in den Badge-Links durch dein GitHub-Repository, z. B. `my-org/sunzi-cerebro`.

- CI: [![CI](https://github.com/<owner>/<repo>/actions/workflows/main.yml/badge.svg)](https://github.com/<owner>/<repo>/actions)
- Release: [![Release](https://github.com/<owner>/<repo>/actions/workflows/release.yml/badge.svg)](https://github.com/<owner>/<repo>/actions)
- Dependencies: [![Deps](https://github.com/<owner>/<repo>/actions/workflows/dependencies.yml/badge.svg)](https://github.com/<owner>/<repo>/actions)
- License: [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Kurzübersicht

Sunzi-Cerebro ist ein Starter- und Referenz-Framework basierend auf Vite, React und TypeScript. Es enthält ein Beispiel-Frontend, Backend-Skripte und CI/CD-Workflows (GitHub Actions) inklusive Release-Management.

## Schnellstart (Entwicklung)

Voraussetzungen: Node.js (>= 18), npm

```bash
# im Projektstamm
npm install
npm run dev
```

Tipp: Dev-Server läuft standardmäßig auf http://localhost:5173

## Build & Preview

```bash
npm run build
npm run preview
```

## Auth-Architektur (kurz)

Das Projekt nutzt ein sicheres Cookie-basiertes Auth-System:

- Tokens werden als httpOnly, Secure Cookies vom Backend gesetzt (keine Speicherung im localStorage).
- Frontend sendet Anfragen mit `credentials: 'include'` / `axios` mit `withCredentials: true`.
- Endpunkte (Beispiele) im Backend:
  - POST /api/auth/login -> setzt httpOnly Access Token (Kurz-Lebensdauer) und Refresh-Token (httpOnly)
  - POST /api/auth/refresh -> erneuert Access Token via Refresh-Token Cookie
  - POST /api/auth/logout -> entfernt Cookies serverseitig
  - GET /api/auth/me -> liefert aktuelle Benutzerdaten (auth nötig)

## Frontend-Integration

- `src/utils/api.ts` konfiguriert den HTTP-Client mit `withCredentials: true`.
- `src/context/AuthContext.tsx` verwaltet den Auth-Status und ruft `/api/auth/me` bzw. `/api/auth/refresh` bei Bedarf auf.

## CI/CD & Deployment

Es sind mehrere GitHub Actions Workflows enthalten:

- `.github/workflows/main.yml` – PR-Checks, Tests, Lint, Build und Staging-Deploy (falls konfiguriert)
- `.github/workflows/dependencies.yml` – automatisierte Abhängigkeits-PRs
- `.github/workflows/release.yml` – erstellt Releases beim Pushen eines `v*`-Tags und sendet Benachrichtigungen

Wichtige Repository-Secrets (für Deployments & Notifications):

- `AZURE_WEBAPP_PUBLISH_PROFILE` oder andere Deploy-Keys
- `SLACK_WEBHOOK_URL` für Release-Notifikationen
- `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `NOTIFICATION_EMAIL` (optional für E-Mail-Benachrichtigungen)

## Developer Setup (lokal)

1. Node installieren (empfohlen: nvm verwenden)
2. Projektabhängigkeiten installieren: `npm install`
3. Umgebung konfigurieren: Kopiere `.env.example` zu `.env` und fülle Backend-URL / Keys
4. Development starten: `npm run dev`
5. Tests ausführen: `npm test` oder `npm run test:watch`

## Tests & Dev Dependencies

Für das lokale Testen und für CI werden zusätzliche Dev-Dependencies benötigt. Empfohlene Pakete für das Frontend:

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

Weitere nützliche Tools (optional):

```bash
npm install -D jest-environment-jsdom
```

Die minimale Jest-Konfiguration ist unter `frontend/jest.config.js` vorbereitet. Nach Installation der Dev-Dependencies kannst du Tests mit `npm test` im Frontend-Ordner ausführen.

.env-Beispiel
------------

Eine `.env.example` wurde dem Projekt hinzugefügt. Kopiere sie zu `.env` und passe `VITE_API_BASE_URL` an deine lokale Backend-URL.

## API-Dokumentation

Detaillierte API- & Auth-Dokumentation findest du unter `DOCS/auth.md`.

## Contributing & Security

Siehe `CONTRIBUTING.md` und `SECURITY.md` für Mitwirkungsleitfäden und verantwortliche Meldung von Sicherheitsproblemen.

## Weitere Ressourcen

- `sunzi-cerebro/` enthält zusätzliche Backend- und Deployment-Skripte.
- `DOCS/` enthält projektbezogene Dokumente und akademische Anlagen.

Fragen oder Probleme? Öffne bitte ein Issue im Repository und verweise auf Reproduktionsschritte und Log-Ausgaben.
