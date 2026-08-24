# Turniermodus – Feature-Spezifikation für Poker Royal

## Kontext
Diese Datei beschreibt eine neue Seite/Feature **"Turniermodus"** für die Poker Royal App. Sie basiert auf dem Ablauf eines realen Live-Turniers ("XXL Poker Night") und definiert alle Regeln, Werte und Anzeigen, die die neue Page abbilden muss.

Ziel: Copilot soll anhand dieser Spezifikation eine neue Page implementieren, die ein laufendes Live-Turnier (Blinds, Zeitplan, Preisgeld, Chipwerte) begleitet.

---

## 1. Turnier-Stammdaten (konfigurierbar)

Diese Felder sollen pro Turnier einstellbar sein (nicht hart codiert):

| Feld | Typ | Beispielwert |
|---|---|---|
| Turniername | string | "XXL Poker Night" |
| Datum/Uhrzeit | datetime | Samstag, 29.08.2026, 20:00 Uhr |
| Ort | string | "Sycon Kirchberg" |
| Buy-In | number (CHF) | 50 |
| Rebuy-Betrag | number (CHF) | 25 |
| Max. Rebuys pro Spieler | number | 1 |

---

## 2. Turnierphasen (Ablauf-Anzeige)

Die Page soll den aktuellen Turnierfortschritt in 5 Phasen visualisieren:

| # | Phase | Beschreibung |
|---|---|---|
| 1 | Start | Alle Spieler starten gemeinsam an zwei grossen Tischen |
| 2 | Turnierphase | Spiel läuft an beiden Tischen parallel |
| 3 | Tischabbau | Spieler werden bei Ausscheiden auf die verbleibenden Tische ausgeglichen |
| 4 | Final Table | Ab 8 verbleibenden Spielern werden beide Tische zu einem Tisch zusammengelegt |
| 5 | Preisgeld | Ab dem Final Table werden die Preisgeldplätze ausgespielt |

**Regel Tischzusammenlegung:** Sobald insgesamt nur noch 8 Spieler im Turnier übrig sind, werden die zwei Tische zu einem Final Table zusammengeführt.

---

## 3. Preisverteilung (Final Table, 8 Plätze)

Preisgeld wird **prozentual vom Gesamtpott** berechnet. Gesamtpott = (Anzahl Spieler × Buy-In) + (Anzahl genutzter Rebuys × Rebuy-Betrag).

| Rang | Anteil am Pott |
|---|---|
| 1 | 40% |
| 2 | 25% |
| 3 | 15% |
| 4 | 10% |
| 5 | 6% |
| 6 | 4% |
| 7 | 0% |
| 8 | 0% |

Die Page soll aus dem aktuellen Pott automatisch die CHF-Beträge je Rang berechnen und anzeigen.

---

## 4. Chip-Sets (Startstacks)

Zwei Stack-Konfigurationen, je nach Buy-In bzw. Rebuy:

**Buy-In Stack (Total 10'000)**

| Chip-Farbe | Wert | Anzahl |
|---|---|---|
| Grün | 25 | 8 |
| Schwarz | 100 | 8 |
| Grün | 500 | 6 |
| Schwarz | 1'000 | 6 |

**Rebuy Stack (Total 5'000)**

| Chip-Farbe | Wert | Anzahl |
|---|---|---|
| Grün | 25 | 4 |
| Schwarz | 100 | 4 |
| Grün | 500 | 3 |
| Schwarz | 1'000 | 3 |

---

## 5. Blindstruktur (Timer)

Die Page braucht einen Level-Timer, der automatisch (oder manuell weiterschaltbar) durch folgende Struktur läuft:

| Level | Small Blind | Big Blind | Dauer |
|---|---|---|---|
| 1 | 25 | 50 | 30 min |
| 2 | 50 | 100 | 30 min |
| 3 | 75 | 150 | 30 min |
| **Pause** | – | – | 10 min |
| 4 | 100 | 200 | 30 min |
| 5 (Rebuy-Ende) | 150 | 300 | 30 min |
| 6 | 200 | 400 | 30 min |
| **Pause** | – | – | 10 min |
| 7 | 300 | 600 | 30 min |
| 8 | 400 | 800 | 30 min |
| 9 | 500 | 1'000 | 30 min |
| **Pause** | – | – | 10 min |
| 10 | 750 | 1'500 | 30 min |
| 11 | 1'000 | 2'000 | 30 min |
| 12 | 1'500 | 3'000 | 30 min |
| 13 | 2'000 | 4'000 | 30 min |

**Regel:** Ab Level 5 sind keine Rebuys mehr möglich.

---

## 6. Technische Anforderungen für die Implementierung

- **Neue Route/Page**, z. B. `/tournament`
- **Datenmodell `TournamentConfig`**:
  - `name`, `date`, `location`, `buyIn`, `rebuyAmount`, `maxRebuys`
  - `blindLevels: { level, smallBlind, bigBlind, durationMinutes, isBreak, isRebuyEnd }[]`
  - `prizeDistribution: { rank, percentage }[]`
  - `chipSets: { type: "buyIn" | "rebuy", chips: { color, value, count }[] }[]`
- **Countdown-Timer** pro Blind-Level inkl. Pausen, mit Anzeige von aktuellem/nächstem Level
- **Live-Pott-Anzeige**: berechnet sich aus Anzahl Spieler + genutzten Rebuys
- **Preisgeld-Anzeige**: berechnet CHF-Beträge live aus Pott × Prozentsatz je Rang
- **Phasen-Anzeige**: zeigt aktuelle Turnierphase (siehe Abschnitt 2), inkl. Trigger für Tischzusammenlegung bei 8 Spielern
- Persistenz optional über bestehendes Supabase-Backend der App

---

## 7. Beispielwerte (aus Vorlage "XXL Poker Night")

Diese Werte können als Default/Seed-Daten für die erste Umsetzung verwendet werden — siehe Abschnitte 1–5 oben.
