# Beitragen zu Sunzi Cerebro

## Entwicklungsphilosophie

Unser Projekt folgt diesen Kernprinzipien:

- **Qualität vor Geschwindigkeit**: Gründliches Testing und sauberer Code sind wichtiger als schnelle Releases
- **Sicherheit von Anfang an**: Security muss bereits im Design berücksichtigt werden
- **Dokumentationsgetriebene Entwicklung**: Neue Features benötigen entsprechende Dokumentation
- **Intuitive Benutzererfahrung**: UX/UI-Entscheidungen basieren auf Nutzerforschung

## Entwicklungsworkflow

### 1. Vorbereitung

```bash
# Repository klonen
git clone https://github.com/Leviticus-Triage/Sunzi-Cerebro.git
cd Sunzi-Cerebro

# Dependencies installieren
npm install

# Entwicklungsbranch erstellen
git checkout -b feature/your-feature-name
```

### 2. Entwicklungsrichtlinien

#### Code-Style

- **TypeScript**: Strikte Typisierung verwenden
- **ESLint**: Keine Warnungen oder Fehler
- **Prettier**: Automatische Formatierung nutzen
- **Tests**: Jest für Unit-Tests, Cypress für E2E

#### Commit-Konventionen

```
type(scope): beschreibung

- type: feat|fix|docs|style|refactor|test|chore
- scope: frontend|backend|docs|deployment
- beschreibung: Prägnante Beschreibung im Imperativ
```

Beispiele:

```
feat(frontend): implementiere Login-Komponente
fix(backend): korrigiere JWT-Validierung
docs(api): aktualisiere OpenAPI-Spezifikation
```

### 3. Pull Request Prozess

1. **Branch aktualisieren**

```bash
git fetch origin
git rebase origin/main
```

2. **Qualitätschecks**

- Alle Tests bestanden
- Code-Coverage > 80%
- Keine ESLint-Warnungen
- Dokumentation aktualisiert

3. **PR erstellen**

- Aussagekräftiger Titel
- Detaillierte Beschreibung
- Screenshots bei UI-Änderungen
- Referenzierte Issues

4. **Review-Prozess**

- Mindestens 2 Approvals notwendig
- CI/CD-Pipeline bestanden
- Security-Scan ohne Findings

### 4. Review-Richtlinien

#### Als Autor

- Kleine, fokussierte PRs
- Selbst-Review vor Submission
- Proaktiv Feedback einarbeiten

#### Als Reviewer

- Code-Qualität prüfen
- Design-Entscheidungen hinterfragen
- Security-Aspekte beachten
- Performance-Implikationen bewerten

## Testing-Anforderungen

### Unit Tests

- Jest für Frontend/Backend
- Coverage > 80%
- Mocks für externe Services

### Integration Tests

- API-Tests mit Supertest
- DB-Integration testen
- Message Queue Tests

### E2E Tests

- Cypress für Frontend
- Kritische User Flows
- Cross-Browser Tests

## Dokumentationsanforderungen

### Code-Dokumentation

- JSDoc für Funktionen
- Interface-Beschreibungen
- Komplexe Algorithmen erklären

### API-Dokumentation

- OpenAPI/Swagger
- Beispiel-Requests
- Error-Handling

### Architektur-Dokumentation

- Komponenten-Diagramme
- Datenfluss-Beschreibungen
- Technische Entscheidungen

## Sicherheitsrichtlinien

### Code-Security

- OWASP Top 10 beachten
- Dependency-Scanning
- Security-Headers setzen

### Daten-Security

- Sensitive Daten verschlüsseln
- Input-Validierung
- Rate-Limiting

### Infrastruktur-Security

- HTTPS/TLS
- Regelmäßige Updates
- Access-Control

## Performance-Richtlinien

### Frontend

- Lazy Loading
- Code-Splitting
- Asset-Optimierung

### Backend

- Query-Optimierung
- Caching-Strategien
- Connection-Pooling

## Debugging & Monitoring

### Logging

- Strukturiertes Logging
- Log-Levels beachten
- Sensitive Daten filtern

### Monitoring

- Metriken sammeln
- Dashboards pflegen
- Alerts konfigurieren

## Support & Kommunikation

### Issues

- Bug-Reports
- Feature-Requests
- Sicherheitslücken

### Kommunikation

- GitHub Discussions
- Pull Request Reviews
- Tech-Dokumentation

## Lizenz

Bitte beachten Sie unsere [LICENSE](LICENSE) Datei für Details zu Ihren Rechten und Pflichten bei der Mitarbeit an diesem Projekt.
