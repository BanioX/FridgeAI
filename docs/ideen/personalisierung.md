# Personalisierung: Rezepte, Menüplanung, Zielgruppen

Ziel: rettich soll für **alle ein No-Brainer** sein (scannen, essen, fertig) und für Leute mit Zielen **mehr können**. Die Personalisierung baut auf Daten auf, die schon da sind: Vorrat, Ablaufdaten, Nährwerte nach dem Scan (10b) und Preise vom Bon.

## Bausteine

| Idee | Nutzen | Aufwand | Braucht |
| --- | --- | --- | --- |
| **Rezepte aus bald Ablaufendem** (Plan 11b/11c) | 3 Vorschläge, die das Retten einfach machen; fehlende Zutaten mit einem Tipp auf die Liste | M | kuratierte Rezepte (selbst geschrieben), Zutaten → Kategorien |
| **Nach dem Kochen abbuchen** (R-03) | Vorrat stimmt ohne Tippen | M | Rezept-Zutaten mit Mengen |
| **Menüplanung Woche** | Plan Mo–So aus Vorrat plus Einkauf; bald Ablaufendes zuerst; Einkaufsliste entsteht von selbst | L | Rezepte, Liste (11a fertig), Portionen pro Person |
| **Profil** | Ernährungsform (vegetarisch, vegan), Allergien (aus OFF-Tags), Haushaltsgrösse, Ziele | S | Einstellungen lokal, später im Konto |
| **Eigene KI** (ADR-0012) | Rezeptideen und Menüs aus dem eigenen Vorrat, ohne Kosten für uns | S | Prompt mit Vorratsliste (Kopieren/Einfügen) |

## Zielgruppen und was sie extra bekommen

- **No-Brainer (alle):**
  - Standardwerte statt Fragen. Kein Profil nötig.
  - «Heute retten» und eine Rezeptidee pro Tag.
  - Alles andere ist versteckt, bis man es braucht.
- **Sportler:innen:**
  - Eiweiss und Kalorien pro Tag aus dem, was gegessen wurde (Menge × Nährwerte pro 100 g).
  - Ziele, z. B. 140 g Eiweiss.
  - «Eiweissreich» als Filter bei Rezepten.
  - Abgrenzung zu Yazio: kein Kalorien-Tagebuch mit Wiegen, sondern was ohnehin aus dem Vorrat kommt.
- **Frugalist:innen:**
  - Kosten pro Mahlzeit und pro Monat.
  - Gerettet in CHF (gibt es schon).
  - Preisentwicklung pro Produkt aus den Bons.
  - «Günstigste Woche» in der Menüplanung.
  - Später Aktionen der Händler über Partner.
- **Tracker:innen:**
  - Statistiken (Woche, Monat, Jahr), Verlauf und Export als CSV.
  - Ziele wie «unter 5 % Weggeworfenes».
  - Später Health-Export (Apple Health nur nativ).

## Reihenfolge (Vorschlag)

1. Rezepte aus Ablaufendem (11b, 11c) mit Profil-Grundlagen (Ernährungsform, Allergien).
2. Kosten pro Mahlzeit und Monatsstatistik (Daten sind da).
3. Nährwert-Tagessumme für Sportler:innen (optional einschaltbar).
4. Menüplanung Woche, verbunden mit der Einkaufsliste.

## Offene Punkte

- Rezepte: selbst schreiben (rund 30 Schweizer Alltagsgerichte, Plan 11b) oder lizenzieren. Lizenz kostet → Alban.
- Nährwerte ohne Barcode (Gemüse, Brot vom Bäcker): Schweizer Nährwertdatenbank des BLV (offen) pro Kategorie (Plan, Ausblick v1).
