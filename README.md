# Poker Royal — Setup

## 1. Supabase Projekt
1. https://supabase.com → neues Projekt erstellen (gratis)
2. SQL Editor öffnen → Inhalt von `supabase_schema.sql` einfügen und ausführen
3. Project Settings → API → kopiere `URL` und `anon public` Key

## 2. Keys in die HTML eintragen
In `poker_app.html` ganz oben im `<script>`-Block:
```js
const SUPABASE_URL = 'https://muastgqwrnajfqhtricq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11YXN0Z3F3cm5hamZxaHRyaWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDc1NTUsImV4cCI6MjA5NDY4MzU1NX0.2Ep00IbfTiVPbQcFkbv6kCQMr2u2q7adGhfFDjho0NU';
```

## 3. Auth-URLs in Supabase eintragen
Authentication → URL Configuration:
- **Site URL**: deine künftige App-URL (z.B. `https://poker-royal.pages.dev`)
- **Redirect URLs**: dieselbe URL hinzufügen

Email/Magic Link ist standardmässig aktiviert.

## 4. Online stellen
Wähle eine Option:

**Cloudflare Pages (empfohlen)**
- https://pages.cloudflare.com → "Create" → "Upload assets"
- HTML-Datei hochladen → fertig, du bekommst eine URL

**Netlify Drop**
- https://app.netlify.com/drop → HTML reinziehen → fertig

**GitHub Pages**
- Repo erstellen, HTML pushen, Settings → Pages aktivieren

## 5. Nutzung
- Mit Email einloggen → Magic Link in der Inbox klicken
- Gruppe erstellen oder mit Code beitreten
- Spieler verwalten, Spiele tracken, Verlauf anschauen

Der Einladungs-Code einer Gruppe gibt Vollzugriff auf alle Daten dieser Gruppe.

## 6. PWA (Installierbar auf iPhone & Android)

Die App ist eine installierbare PWA. Relevante Dateien:
`manifest.webmanifest`, `sw.js`, `icons/`, `.nojekyll`.

**Lokal testen** (Service Worker brauchen http/https, nicht `file://`):
```powershell
node tools/serve.js --base /poker-royale/
# -> http://localhost:8099/poker-royale/
```
Chrome DevTools → **Application → Manifest** (Icons/Install-Check) und
**Application → Service Workers** (registriert/aktiv). Offline-Test: Network → "Offline" → Reload.

**Icons neu erzeugen** (nach Austausch der Platzhalter nicht nötig):
```powershell
node tools/generate-icons.js
```

**Nach App-Änderungen**: in `sw.js` die `CACHE_VERSION` hochzählen, damit Clients das Update sicher ziehen.

## 7. Seasons

Spiele und Turniere sind über die Spalte `season` einer Season zugeordnet.
Alte Seasons bleiben als Archiv erhalten und sind im Tab *Verlauf* über die
Season-Tabs abrufbar. Zusätzlich gibt es den Tab **★ All-Time** mit einer
Gesamtwertung über alle Seasons (Cash Games **und** Turniere).

| Season | Status | Migration |
|---|---|---|
| 1 | Archiv | `migration_season2.sql` |
| 2 | Archiv | `migration_season2.sql` |
| 3 | **aktiv** | `migration_season3.sql` |

**Neue Season starten:**
1. Migration schreiben: `ALTER TABLE games/tournaments ALTER COLUMN season SET DEFAULT <n>;`
   (siehe `migration_season3.sql`) und im Supabase SQL Editor ausführen.
2. In `index.html`: `ACTIVE_SEASON` auf `<n>` setzen und die vorherige Season
   zu `ARCHIVED_SEASONS` hinzufügen.
3. Season-Tab-Buttons in `#tab-history` ergänzen.
4. `CACHE_VERSION` in `sw.js` hochzählen.

Der Champion einer abgeschlossenen Season (bestes Cash-Game-Netto) bekommt
automatisch sein Abzeichen (`S1 Champ`, `S2 Champ`, …) neben dem Namen.

