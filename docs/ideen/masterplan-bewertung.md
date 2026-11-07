# Masterplan «rettich.app»: was wir übernehmen

Stand: 7.11.2026. Albans Masterplan (Brand, Tech, Business) gemessen an Plan, ADRs und den harten Regeln in CLAUDE.md.

## Übernommen (jetzt umgesetzt)

| Punkt | Umsetzung |
| --- | --- |
| Schreibweise **rettich** (Verb «rett' ich»), auf dem Home-Bildschirm «Rettich» | ADR-0032 (Nachtrag), überall in App, PDF und Doku |
| Claim **«Wirf kein Geld in den Kübel.»** | Willkommenskarte auf Start, README |
| Kein Moralapostel, Franken statt CO₂ | Schon so. «Gerettet» zählt seit ADR-0033 nur echte Rettungen und ist damit glaubwürdig. |
| Symbol: Rettich gekippt, Magenta-Schulter, Blatt als Häkchen, auf Tiefgrün | Neues App-Symbol, eigener PR |
| **Feierabend-Modus**: höchstens 15 Minuten, nichts einkaufen | Filter «Feierabend» auf Kochen, eigener PR |
| Ampel grün, gelb, rot | Schon da (Status-Chips, «Läuft bald ab») |
| Swipe-to-Cook | Schon da als Tab «Kochen» mit «Rette heute» |
| Keine frühe Paywall | Passt zu `monetarisierung.md` |

## Später (steht im Plan oder in den Ideen)

| Punkt | Wo | Bemerkung |
| --- | --- | --- |
| Multiplayer-Kühlschrank (WG, Paar) per Einladungslink | Plan, Schritt 7 (Konten, Sync) | Braucht Server und Konten, also einen neuen Datenfluss: Alban entscheidet |
| 17-Uhr-Widget auf dem Home-Bildschirm | `app-stores.md` | Geht nur mit der nativen App |
| Rett-Tacho mit Wochen-Streak | `design-und-bedienung.md` | Klein, sobald die Zahlen im Pilot stimmen |
| `rettich+` (CHF 3.90/Monat): Wochenplaner, Makros, Fitness | `monetarisierung.md`, `ausgaben-und-ernaehrung.md` | Preis und Grenzen entscheidet Alban |
| Visual Identity «Radish Pop» für die ganze App | `design.md` | Vorerst nur Symbol und Marketing. Neon-Minze auf Weiss erfüllt den Kontrast nach WCAG nicht. Die App bleibt hell nach Apple HIG (ADR-0021). Ein Dunkelmodus kann die Farben aufnehmen. |

## Braucht Albans Entscheid (kostet Geld oder neue Datenflüsse)

| Punkt | Kosten oder Risiko | Empfehlung |
| --- | --- | --- |
| Domain **rettich.app** | jährliche Gebühr | Kaufen, am einfachsten bei Cloudflare (DNS liegt dann schon richtig) |
| Domain **rettich.ai** | deutlich teurer, oft mit Mindestlaufzeit | Erst später, nur als Schutz |
| **hi@, alban@, partner@** | Empfangen über Cloudflare Email Routing ist gratis. Senden ab der Adresse braucht einen Mail-Dienst. | Weiterleitung auf Gmail reicht für den Start |
| Social-Handles @rettich.app | gratis | Alban sichert sie selbst. Claude kann keine Konten anlegen. |
| **1-Snap mit Vision-KI** (Foto vom Kühlschrank auf dem Server) | Kosten pro Bild, Fotos verlassen das Gerät | Heute: Bon auf dem Gerät lesen (ADR-0028) und Foto über die eigene KI (ADR-0012), ohne Kosten. Server-KI erst mit `rettich+`. |
| **bon@rettich.app** (Bons per Mail weiterleiten) | Bons gehen an einen Server | Spannend für Cumulus und Supercard, braucht Server, Datenschutz-Text und Löschfristen |
| Lokale «Rett-Matches» (Bäckerei im Umkreis) | Standort, Partner | Nur mit Einwilligung, Partner nur über Interfaces mit Mocks (CLAUDE.md) |

## Mit unseren Regeln abgleichen

- **Gesponserte Produkte und Affiliate (Phase 3):** Erlaubt sind nur Interfaces mit Mocks, bis Alban Verträge hat. Werbung muss klar als Werbung erkennbar sein.
- **«Anonymisierte FMCG-Insights»:** Nur aggregiert, nie Einzeldaten, und nur mit ausdrücklicher, widerrufbarer Einwilligung pro Haushalt (CLAUDE.md). Mindestgrössen pro Gruppe, damit niemand erkennbar wird.
- **«Spar bis zu CHF 800.– pro Jahr»:** Nur mit belegter Quelle verwenden (z. B. BAFU-Zahlen zu Food Waste im Haushalt). Sonst ist es irreführende Werbung (UWG).
- **Emoji in der Bio:** 🥕 ist eine Karotte. Für den Rettich gibt es kein Emoji. Besser 🥬 oder keines.
- **Google Stitch und Pomelli:** frei wählbare Werkzeuge. Ein Export als `DESIGN.md` lässt sich mit `docs/design.md` abgleichen.
