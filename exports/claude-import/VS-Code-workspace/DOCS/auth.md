# Authentifizierungs-Architektur und API (Sunzi-Cerebro)

Dieses Dokument beschreibt die Backend-Auth-Endpunkte, Cookie-Verhalten, Sicherheitsempfehlungen und Beispiele für die Frontend-Integration.

## Architekturübersicht

- Access Token: Kurzlebiger Token (z. B. 5-15 Minuten), wird als httpOnly, Secure Cookie gesetzt.
- Refresh Token: Länger lebender Token, ebenfalls als httpOnly, Secure Cookie gespeichert.
- Tokens werden nicht im localStorage oder sessionStorage gehalten.
- Frontend sendet Anfragen mit Credentials (CORS + cookies): axios:{ withCredentials: true } oder fetch mit `credentials: 'include'`.

## Endpunkte (Beispiele)

1. POST /api/auth/login

- Zweck: Authentifiziert Benutzer mit E-Mail/Passwort und setzt Access- & Refresh-Cookies.
- Request Body (JSON):
  {
  "email": "user@example.com",
  "password": "s3cr3t"
  }
- Response: 200 OK
  - httpOnly Cookies:
    - `access_token` (Secure, httpOnly, SameSite=Lax oder Strict je nach Bedarf)
    - `refresh_token` (Secure, httpOnly, Longer expiry)
  - Optional: Response Body { user: { id, email, name } }

2. POST /api/auth/refresh

- Zweck: Erneuert Access Token mithilfe des Refresh Token-Cookies.
- Request: leer (Cookies werden automatisch mitgesendet)
- Response: 200 OK, neues `access_token` Cookie gesetzt

3. POST /api/auth/logout

- Zweck: Invalidiert Tokens serverseitig und entfernt Cookies.
- Request: leer (Cookies werden automatisch mitgesendet)
- Response: 200 OK

4. GET /api/auth/me

- Zweck: Liefert Informationen zum aktuell authentifizierten Benutzer.
- Request: leer (Cookies werden automatisch mitgesendet)
- Response: 200 OK
  - Body: { user: { id, email, name, roles: [] } }

## Sicherheit & Best Practices

- HttpOnly Cookies: Verhindern XSS-Zugriff.
- Secure Flag: Nur über HTTPS senden.
- SameSite: `Lax` oder `Strict` je nach Cross-Site Anforderungen.
- CSRF: Bei Verwendung von Cookies überlegen, CSRF-Schutz (SameSite + CSRF-Token-Pattern oder double-submit) einzusetzen.
- Refresh Token Rotation: Implementiere Rotation und Blacklisting (bei Kompromittierung).
- Cookie Expiry: Access kurz, Refresh länger, aber mit serverseitiger Kontrollmechanik.

## Frontend-Beispiele

Axios Konfiguration:

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  withCredentials: true,
});

export default api;
```

Login Beispiel (Service):

```ts
import api from '../utils/api';

export async function login(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}
```

Refresh-Ablauf (vereinfachtes Beispiel):

```ts
// In AuthContext oder API-Interceptor
try {
  const res = await api.get('/api/auth/me');
  // OK
} catch (err) {
  // Wenn 401 -> call refresh
  await api.post('/api/auth/refresh');
  // retry original request
}
```

## Fehlerbehandlung

- 401 Unauthorized: Triggern Refresh-Mechanismus. Wenn Refresh fehlschlägt -> Logout und Weiterleitung zur Login-Seite.
- 403 Forbidden: Keine ausreichenden Rechte.
- 429 Rate Limit: Backoff.

## Test- und Entwicklungs-Hinweise

- Lokale Entwicklung: Setze Backend-CORS, damit Cookies von `localhost:5173` akzeptiert werden (Access-Control-Allow-Credentials: true und origin entsprechend).
- Nutze `ngrok` oder eine HTTPS-Dev-Umgebung, um Secure-Cookie-Verhalten zu testen.

## Glossar

- httpOnly: Cookie kann nicht per JS gelesen werden
- Secure: Cookie nur über HTTPS
- SameSite: Regel für Cross-Site-Cookie-Sends

---

Für detaillierte Backend-Implementierungsbeispiele siehe `sunzi-cerebro/backend` (falls vorhanden) oder frage nach konkreten Frameworks (Express, Fastify, NestJS etc.).
