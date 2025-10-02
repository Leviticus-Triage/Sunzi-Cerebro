# Audit Summary — Claude snapshot (sanitized)

Kurz: Schneller Scan nach typischen Secrets und auffälligen Artefakten.

Gefundene Treffer (stichprobenartig):
- k8s/base/secrets.yaml enthält placeholder API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, VAPID_PRIVATE_KEY — sind Platzhalter und müssen ersetzt/rotated vor Prod-Deploy.
- `DEPLOYMENT_PACKAGE/setup-mcp-servers.sh` referenziert `NOTION_API_KEY` als env-Variable.
- Einige Backup- und Session-Backups-Dateien enthalten sensible Logs (bereits entfernt in sanitized import).

Empfohlene Maßnahmen:
1. Rotieren aller keys, die in `k8s/base/secrets.yaml` und ähnlichen Dateien referenziert werden.
2. Keine produktiven secrets in Git speichern; stattdessen GitHub Secrets oder Vault verwenden.
3. CI: Füge einen Secret-Scan-Job hinzu (truffleHog/gitleaks) für PRs auf `import/*` Branches.
4. Führe vollständige Build- und Smoke-Tests in einer isolierten Staging-Umgebung, bevor Prod-Deploy.

Weiteres:
- Siehe auch: `.github/PULL_REQUEST_TEMPLATE.md` für Prüfliste beim Review.
