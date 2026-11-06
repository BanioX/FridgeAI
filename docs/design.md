# FridgeAI – Design-System

> **Leitbild (Alban, 6.11.2026):** grün, food-freundlich, elegant und funktional.
> Umsetzung: Tokens in `apps/web/src/index.css` (`@theme`), Komponenten in `apps/web/src/ui/`.

## Haltung

- **Frisch statt laut:** Kräutergrün als Markenfarbe, warmes Off-White wie Backpapier als Hintergrund, viel Weissraum. Keine Neon-Töne, keine Verläufe.
- **Funktion vor Dekor:** Farbe trägt Bedeutung. Grün = frisch/ok, Aprikose = bald, Tomate = heute, Rot = nicht mehr essen. Jede Farbaussage hat zusätzlich Text oder Symbol (nie nur Farbe, wegen Farbsehschwäche).
- **Elegant durch Typografie:** Eine weiche Serifenschrift für Titel und grosse Zahlen (CHF gerettet), eine klare Sans für alles Bedienbare.
- **Daumenfreundlich:** Wichtige Aktionen unten, Touch-Ziele mindestens 44 px, eine Hauptaktion pro Screen.

## Farben

Alle Text-/Hintergrund-Paare erfüllen WCAG AA (mindestens 4.5:1), geprüft beim Festlegen.

| Token | Wert | Verwendung |
| --- | --- | --- |
| `basil-50 … 950` | `#F0F7F2` … `#0D2317` (500 = `#3B8A5A`, 600 = `#2C7149`, 700 = `#245B3C`) | Marke, Primäraktionen, «frisch» |
| `oat` (Hintergrund) | `#F8F6F1` | App-Hintergrund |
| `surface` | `#FFFFFF` | Karten, Navigation |
| `surface-muted` | `#F1EEE6` | Eingabefelder, Chips |
| `line` | `#E4DFD3` | Trennlinien, Ränder |
| `ink` | `#1C211E` | Haupttext (15:1) |
| `ink-muted` | `#5B635D` | Nebentext (5.7:1) |
| `soon` | Text `#8A4B0F` auf `#FFF1DF`, Akzent `#E39A3B` | läuft in 1–3 Tagen ab |
| `today` | Text `#A63A22` auf `#FDEBE6`, Akzent `#E0603F` | läuft heute ab / MHD abgelaufen |
| `danger` | Weiss auf `#B3261E` | Verbrauchsdatum abgelaufen: «Nicht mehr essen» |
| `ice` | Text `#2A6B8C` auf `#E6F3F8` | Tiefkühler |
| `wheat` | Text `#8A5F14` auf `#F8F0DC` | Vorratsschrank |
| `olive` | Text `#4F5D27` auf `#ECEEE0` | Notvorrat (6.1:1) |

**Lagerorte haben je eine Akzentfarbe:** Kühlschrank = Basilikum, Tiefkühler = Eis, Vorratsschrank = Weizen, Notvorrat = Oliv.

## Schrift

Systemschrift nach Apples Human Interface Guidelines (ADR-0021): SF Pro auf Apple-Geräten, Roboto auf Android, Segoe UI unter Windows. Es wird nichts geladen, die Grössen in `rem` folgen der Textgrösse des Systems.

| Rolle | Grösse/Gewicht |
| --- | --- |
| Grosser Titel (`large-title`) | 34 px, 700 |
| Text und Bedienung | 17 px, 400/600 |
| Klein (Meta, Chips) | 13–14 px, 600 |

## Form, Tiefe, Bewegung

- Radien: 10 px (Segmente), 12 px (Segment-Spur), 12 px (Eingaben, Buttons), 16 px (Karten), 24 px (Sheets), Pill für Chips und Status.
- Schatten sparsam: Karten nur hauchdünn, schwebende Elemente (Sheets, Toast) etwas mehr.
- Bewegung 150–200 ms, ease-out; `prefers-reduced-motion` schaltet Animationen ab.

## Icons und Lebensmittel

- **Icons:** Lucide (ISC-Lizenz), Linienstärke 1.75, 22 px in der Navigation.
- **Lebensmittel:** Emoji pro Kategorie (🥛 🧀 🥬 🍎 🥩 🐟 🍞 🥚) für schnelles Wiedererkennen in Listen, ohne Bild-Assets. Kommt mit dem Kategorien-Katalog (Schritt 2b).

## Muster (werden mit den Features gebaut)

- **Artikelzeile:** links 4-px-Statusstreifen, Emoji, Name, darunter Menge · Lagerort, rechts Status-Chip («heute», «morgen», «in 3 Tagen»).
- **Startseite «Heute retten»:** grosse Zahl (Wert im Kühlschrank in CHF), darunter die dringendsten Artikel, Lagerorte als drei Kacheln.
- **Navigation:** weisse Leiste unten, aktives Ziel mit Basilikum-Pill hinter dem Icon.
- **Segment-Auswahl** (2–4 kurze Optionen, z. B. «Wo ist es?»): eine graue Spur mit gleich breiten Segmenten, 13 px. Das gewählte Segment ist basilikumgrün mit weisser Schrift statt iOS-weiss, damit der Zustand 3:1 Kontrast hat. Sehr lange Wörter trennen auf schmalen Handys mit Bindestrich.
- **Auswahl-Chips** (Portionen, Gründe): Pills, die umbrechen.
- **Primärbutton:** `basil-700`, weisse Schrift (8:1), volle Breite auf Mobile.

## Datumsfeld (Ablaufdatum)

**Ziel (Alban, 6.11.2026):** State of the Art, kein «30 Mal klicken», und trotzdem schreibbar. Typisch: 1 Tipp, höchstens 6 Ziffern.

1. **Vorschlag vorausgewählt:** Das Feld ist mit dem Datum aus dem Scan (2D-Code) oder der Kategorie-Schätzung vorbelegt; «geschätzt» ist sichtbar markiert. Passt es, ist nichts zu tun.
2. **Schnellwahl-Chips** passend zum Zeithorizont (`expiryPresets` in `core`): Kühlschrank «morgen · 2 T · 3 T · 1 Wo · 2 Wo», Tiefkühler «1 Wo · 1 Mt · 3 Mt · 6 Mt · 1 J», Vorrat «6 Mt · 1 J · 2 J · 3 J · 5 J», Notvorrat «1 J · 5 J · 10 J · 25 J · 50 J».
3. **Tippen:** ein Textfeld mit Ziffern-Tastatur (`inputmode="numeric"`). Punkte erscheinen beim Tippen automatisch (`061126` → `06.11.26`). Akzeptiert auch `6.11.26`, `06:11:2026`, `6/11/2026`, `6.11.` (ohne Jahr) und `11.2026` (Monatsende, wie auf Etiketten; `parseDateInput`). Live-Vorschau darunter: «Fr, 6. Nov. 2026 · in 3 Tagen» bzw. «in 25 Jahren».
4. **Kalender:** Ein Kalender-Symbol öffnet die native Datumsauswahl des Geräts (iOS-Rad, Android-Kalender) zum Blättern. Grosse Sprünge (Jahrzehnte) gehen schneller über Tippen oder Chips.
5. **Fehler und Grenzfälle:** «Kein gültiges Datum, z. B. 06.11.2026» direkt unter dem Feld. Ein Datum in der Vergangenheit ist erlaubt (bereits abgelaufen), mit Hinweis.
6. **Barrierefrei:** sichtbares Label, Vorschau über `aria-describedby`, Chips als Radiogruppe, alles per Tastatur bedienbar.

## Später

- Dunkelmodus: Tokens sind CSS-Variablen, dunkle Werte folgen in Schritt 12c.
- PNG-Icons und Splash-Screens für die Installation: Schritt 12c.
