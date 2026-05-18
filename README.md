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
