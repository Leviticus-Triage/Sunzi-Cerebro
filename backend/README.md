# Sunzi Cerebro - Backend

Starten und Testen (lokal):

```bash
# Install dependencies
cd backend
npm install

# Development (hot-reload)
npm run dev

# Build
npm run build

# Start (production)
npm start

# Tests
npm test
```

Sicherheits- und Auth-Quickstart:

- JWT secret mit `JWT_SECRET` setzen
- Frontend origin via `FRONTEND_ORIGIN` setzen

## Logging

- Das Backend verwendet `winston` für konsolidiertes Logging. Das Log-Level lässt sich über die Umgebungsvariable `LOG_LEVEL` steuern (z. B. `debug`, `info`, `warn`, `error`).
- In der Entwicklungsumgebung empfiehlt sich `LOG_LEVEL=debug` um detaillierte Informationen zu erhalten. In Produktion sollte `LOG_LEVEL=info` oder `warn` gesetzt werden.
- Beispiel (lokal):

```bash
# Starten mit Debug-Logging
LOG_LEVEL=debug npm run dev
```

Log-Ausgaben werden sowohl in der Konsole als auch in den Dateien `combined.log` und `error.log` gespeichert (Konfiguration in `src/utils/logger.ts`).
