<!-- Pull Request Vorlage für den Import-Branch -->
## Titel (kurz)
Import: Claude snapshot v4.0 — Sanitized deployment snapshot

## Beschreibung
Dieser Pull Request enthält einen sanitisierten Import der Deployment-Snapshot-Dateien, die von Claude erstellt wurden. Sensible Dateien und die ursprüngliche Git-Historie wurden entfernt, siehe `/exports/claude-import/` für die importierten Artefakte.

Kurzfassung der Änderungen:
- Importierte Dokumentation und Frontend-/Backend-Quellen (sanitized)
- Stubs/Platzhalter für fehlende/entfernte Artefakte

## Prüf-Checkliste (Reviewer)
- [ ] Secret-Scan bestätigen (keine produktiven API-Keys oder private keys)
- [ ] Build & Smoke-Test (Frontend `vite build`, Backend minimale Startprüfung)
- [ ] Lint/Type-Check ausführen
- [ ] Reviewer: Backend/Frontend Leads zuweisen
- [ ] Labels: `import`, `audit-required`, `sanitized-import`

## Wichtige Hinweise
- Sensitive Dateien wurden entfernt, aber bitte prüft die Datei `exports/claude-import/AUDIT_SUMMARY.md` für Fundstellen und empfohlene Gegenmaßnahmen.
- Falls produktive Schlüssel gefunden werden: rotieren und betroffene Deployments zurückstufen.

## Vorschlag für Reviewer
- @owner-backend
- @owner-frontend

## Referenzen
- Import-Quelle: Claude snapshot (sanitized)
