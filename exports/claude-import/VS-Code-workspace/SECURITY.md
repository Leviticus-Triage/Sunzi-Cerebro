# Security Policy

Vielen Dank, dass du Sicherheitsfragen melden möchtest. Dieses Dokument beschreibt, wie du Schwachstellen verantwortungsvoll meldest und welche Erwartungen bestehen.

## Verantwortliche Offenlegung

Bitte melde Sicherheitslücken per E-Mail an das Team (oder erstelle ein vertrauliches Issue, falls das Repository private Issue-Templates unterstützt).

- Empfohlene Kontaktadresse: security@example.com (bitte durch Maintainer ersetzen)
- Bitte sende: Betreff, betroffene Komponente, Schritte zur Reproduktion, ggf. PoC, Schweregrad-Einschätzung

## Sicherheitsbewertung

Maintainer werden die Meldung innerhalb von 72 Stunden bestätigen und die nächsten Schritte kommunizieren.

## Verhaltensanweisungen

- Veröffentliche keine Details zu einer Lücke öffentlich, bevor ein Fix bereitgestellt wurde.
- Wenn du Hilfe beim Fix benötigst, biete an, einen PR mit einem Fix zu erstellen.

## Bug-Bounty

Aktuell gibt es kein offizielles Bug-Bounty-Programm.

## CVE & Disclosure

Bei kritischen Schwachstellen werden Maintainer entscheiden, ob ein CVE beantragt wird.

## Sicherheitshinweise für Entwickler

- Secrets: Verwende GitHub Secrets, niemals harte Codierung.
- Dependencies: Regelmäßige Updates durch Dependabot/Workflow.
- CSP/XSS/CSRF: Achte auf sichere Header und SameSite für Cookies.

---

Bitte ersetze `security@example.com` mit der realen Security-Kontaktadresse des Projekts.
