# Sunzi Cerebro React Framework

Eine moderne React-basierte Benutzeroberfläche für die Sunzi Cerebro Security Intelligence Platform.

## 🎯 Überblick

Sunzi Cerebro React Framework ist eine vollständig responsive Web-Anwendung, die als Frontend für die Sunzi Cerebro Security-Plattform dient. Das Framework basiert auf den neuesten Webtechnologien und bietet eine intuitive Benutzeroberfläche für Security-Tools, Scans, Reports und System-Management.

## 🚀 Features

- **🔐 Authentifizierung**: Sichere Benutzerauthentifizierung mit JWT-Token-Management
- **📊 Dashboard**: Umfassendes Dashboard mit Echtzeit-Metriken und System-Übersicht
- **🛡️ Security Tools**: Verwaltung und Konfiguration von Security-Tools (Nmap, Burp Suite, Nuclei, etc.)
- **🔍 Scan Management**: Überwachung und Verwaltung aktiver Security-Scans
- **📈 Reporting**: Erweiterte Reporting-Funktionen mit Exportmöglichkeiten
- **⚙️ Einstellungen**: Umfassende Konfigurationsmöglichkeiten für Benutzer und System
- **📱 Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **🎨 Modern UI/UX**: Material-UI basiertes Design mit Sunzi Cerebro Branding

## 🛠️ Technologie-Stack

- **React 18** - Frontend Framework
- **TypeScript** - Typsichere Entwicklung
- **Vite** - Build-Tool und Entwicklungsserver
- **Material-UI (MUI)** - UI-Komponenten-Bibliothek
- **React Router** - Client-seitiges Routing
- **React Query** - Server-State-Management
- **Axios** - HTTP-Client für API-Kommunikation
- **TailwindCSS** - Utility-First CSS Framework

## 📁 Projektstruktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
│   └── Layout/         # Layout-Komponenten
├── pages/              # Seiten-Komponenten
│   ├── Dashboard/      # Dashboard-Seite
│   ├── Tools/          # Security Tools Verwaltung
│   ├── Scans/          # Scan Management
│   ├── Reports/        # Reporting-Funktionen
│   ├── Settings/       # Einstellungen
│   ├── Login/          # Authentifizierung
│   └── NotFound/       # 404-Seite
├── hooks/              # Custom React Hooks
│   └── useAuth.ts      # Authentifizierung Hook
├── theme/              # Material-UI Theme Konfiguration
├── types/              # TypeScript Typdefinitionen
└── utils/              # Utility-Funktionen
```

## 🚦 Getting Started

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn
- Git

### Installation

1. **Repository klonen:**
   ```bash
   git clone <repository-url>
   cd sunzi-cerebro-react-framework
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   # oder
   yarn install
   ```

3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   # oder
   yarn dev
   ```

4. **Anwendung öffnen:**
   ```
   http://localhost:5173
   ```

### Build für Produktion

```bash
npm run build
# oder
yarn build
```

## 🎨 Design System

Das Framework implementiert das Sunzi Cerebro Design System mit folgenden Farben:

- **Primary**: `#00327c` (Dark Blue)
- **Secondary**: `#404040` (Text Gray)
- **Success**: `#00ca82` (Brand Green)
- **Warning**: `#ff9b26` (Brand Orange)
- **Error**: `#fb5454` (Brand Red)
- **Info**: `#2a76d1` (Secondary Blue)

## 🔐 Authentifizierung

Das Framework unterstützt JWT-basierte Authentifizierung mit folgenden Features:

- Sichere Token-Speicherung im localStorage
- Automatische Token-Validierung
- Rollenbasierte Zugriffskontrolle (Admin, Pentester, Analyst, Viewer)
- Automatische Weiterleitung bei abgelaufenen Sessions

### Demo-Zugangsdaten (Entwicklung):
- **Benutzername**: `sunzi.cerebro`
- **Passwort**: `admin123`

## 📱 Responsive Design

Die Anwendung ist vollständig responsiv und optimiert für:

- **Desktop**: Vollständige Feature-Set mit Sidebar-Navigation
- **Tablet**: Angepasste Layouts mit optimierten Touch-Interfaces
- **Mobile**: Mobile-First Design mit zusammenklappbarer Navigation

## 🔧 Konfiguration

### Umgebungsvariablen

Erstellen Sie eine `.env` Datei im Projekt-Root:

```env
VITE_API_BASE_URL=http://localhost:8890
VITE_APP_NAME=Sunzi Cerebro
VITE_APP_VERSION=1.0.0
```

### API-Integration

Das Framework ist darauf ausgelegt, mit dem Sunzi Cerebro Backend zu kommunizieren:

- **Base URL**: Konfigurierbar über Umgebungsvariablen
- **Authentication**: JWT-Token in Authorization Header
- **Error Handling**: Zentrale Fehlerbehandlung mit Benutzer-Feedback

## 🧪 Testing

```bash
# Unit Tests ausführen
npm run test

# Coverage Report generieren
npm run test:coverage

# E2E Tests (Cypress)
npm run test:e2e
```

## 📦 Verfügbare Scripts

- `npm run dev` - Entwicklungsserver starten
- `npm run build` - Production Build erstellen
- `npm run preview` - Production Build lokal testen
- `npm run lint` - ESLint ausführen
- `npm run lint:fix` - ESLint mit automatischen Fixes
- `npm run type-check` - TypeScript Typ-Checking

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

## 📋 Roadmap

- [ ] **Phase 1**: Dashboard und Tools-Management
- [ ] **Phase 2**: Scan-Management mit Echtzeit-Updates
- [ ] **Phase 3**: Advanced Reporting und Export-Funktionen
- [ ] **Phase 4**: Erweiterte Benutzer-Management
- [ ] **Phase 5**: API-Integration für Backend-Services
- [ ] **Phase 6**: Real-time Notifications und WebSocket-Integration

## 🐛 Bug Reports & Feature Requests

Bitte verwenden Sie GitHub Issues für Bug Reports und Feature Requests.

## 📄 Lizenz

Dieses Projekt ist unter der [MIT Lizenz](LICENSE) lizenziert.

## 👥 Team

- **Architecture**: Sunzi Cerebro Development Team
- **Frontend**: React/TypeScript Specialists
- **UI/UX**: Material Design Implementation
- **Security**: Security-First Development Approach

---

**Hinweis**: Diese Anwendung befindet sich in aktiver Entwicklung. Features und APIs können sich ändern.