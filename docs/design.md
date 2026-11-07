# rettich – Design-System

> **Leitbild (Alban, 6.11.2026):** grün, food-freundlich, elegant und funktional.
> Umsetzung: Tokens in `apps/web/src/index.css` (`@theme`), Komponenten in `apps/web/src/ui/`.

## Haltung

- **Frisch statt laut:** Kräutergrün als Markenfarbe, warmes Off-White wie Backpapier als Hintergrund, viel Weissraum. Keine Neon-Töne, keine Verläufe.
- **Funktion vor Dekor:** Farbe trägt Bedeutung. Grün = frisch/ok, Aprikose = bald, Tomate = heute, Rot = nicht mehr essen. Jede Farbaussage hat zusätzlich Text oder Symbol (nie nur Farbe, wegen Farbsehschwäche).
- **Elegant durch Typografie:** Eine weiche Serifenschrift für Titel und grosse Zahlen (CHF gerettet), eine klare Sans für alles Bedienbare.
- **Daumenfreundlich:** Wichtige Aktionen unten, Touch-Ziele mindestens 44 px, eine Hauptaktion pro Screen.

## Farben

### Fünf Grüntöne aus dem Garten (7.11.2026)

Alban: «frisch wie Salat, Broccoli, Kopfsalat, Rucola, einfach was Mutter Natur hergibt», mit dem ursprünglichen Logo-Grün als Hauptgrün. Die fünf Töne sind die Marke. Alles andere leitet sich aus ihnen ab.

| Name | Wert | Stufe | Wofür |
| --- | --- | --- | --- |
| **Broccoli** | `#0C412A` | `basil-900` | Dunkelstes Grün: Überschriften in Grün, gedrückte Knöpfe, später Dunkelmodus. Weiss darauf 11.6:1 |
| **Rucola** | `#2C7149` | `basil-700` | Das Logo-Grün und die Markenfarbe: Knöpfe, Links, aktiver Tab, ＋. Weiss darauf 5.9:1, auf Hintergrund 5.7:1 |
| **Basilikum** | `#4A9C5C` | `basil-500` | Grafik: Balken, Ringe, Symbole. 3.3:1 auf Hintergrund (WCAG für Grafik: 3:1) |
| **Kopfsalat** | `#CCECAD` | `basil-100` | Frische Flächen: gewählte Chips, Markierungen. Text darauf in `basil-800` (6.4:1) |
| **Eisberg** | `#EFFAE4` | `basil-50` | Ganz helle Flächen: Tipps, Hinweise, ausgewählte Zeilen |

**So sind sie gebaut:**

- **Wie in der Natur:** Helle Töne kippen ins Gelbliche (Kopfsalat in der Sonne, Farbton 130°), dunkle ins Bläuliche (Broccoli im Schatten, 160°). So wirkt die Palette lebendig statt künstlich.
- **Gleichmässige Schritte:** Gerechnet wird in OKLCH, damit die Helligkeitsstufen für das Auge gleichmässig sind. Die Sättigung ist in der Mitte am höchsten und zu den Enden hin tiefer. So gibt es kein Neon und kein Grau.
- **Die Stufen dazwischen** (200, 300, 400, 600, 800, 950) sind aus den Nachbarn interpoliert:

  | Stufe | 200 | 300 | 400 | 600 | 800 | 950 |
  | --- | --- | --- | --- | --- | --- | --- |
  | Wert | `#A7D492` | `#82BC79` | `#60A867` | `#3A8653` | `#1B593A` | `#032819` |

  600 ist nur für Fokusring und Ränder (4.3:1), 800 für grünen Text.
- **60–30–10:**
  - 60 % ruhiger Hintergrund und Weiss.
  - 30 % helle Grünflächen (Eisberg, Kopfsalat).
  - 10 % Rucola für das, was man tippen soll.

  Eine Hauptaktion pro Screen bleibt so sofort sichtbar.
- **Das Logo** (erstes Design, Grund Rucola `#2C7149`) bleibt unverändert. Seine Blätter liegen zwischen Basilikum und Kopfsalat.

Alle Text-/Hintergrund-Paare erfüllen WCAG AA (mindestens 4.5:1, Grafik 3:1), geprüft beim Festlegen.

### Neutrale und Status

**Moderner Look (7.11.2026):** Flächen sind ruhig und fast neutral, Karten weiss ohne Rahmen mit weichem Schatten. Grün steht nur dort, wo du etwas tippst oder etwas gewählt ist (Buttons, gewähltes Segment, aktiver Tab) und in den Hinweis-Karten (Eisberg). So springt das Wichtige ins Auge.

| Token | Wert | Verwendung |
| --- | --- | --- |
| `oat` (Hintergrund) | `#F4F5F1` (fast neutral, ein Hauch Grün) | App-Hintergrund, Statusleiste |
| `surface` | `#FFFFFF` | Karten, Navigation |
| `surface-muted` | `#ECEDE9` | Segment-Spur, Bildgrund, Infokästen |
| `line` | `#DEE0DB` | Haarlinien, Ränder von Eingaben |
| `ink` | `#1C211E` | Haupttext (15:1) |
| `ink-muted` | `#525E56` | Nebentext (6.2:1 auf `oat`) |
| `soon` | Text `#8A4B0F` auf `#FFF1DF`, Akzent `#E39A3B` | läuft in 1–3 Tagen ab |
| `today` | Text `#A63A22` auf `#FDEBE6`, Akzent `#E0603F` | läuft heute ab / MHD abgelaufen |
| `danger` | Weiss auf `#B3261E` | Verbrauchsdatum abgelaufen: «Nicht mehr essen» |
| `ice` | Text `#2A6B8C` auf `#E6F3F8` | Tiefkühler |
| `wheat` | Text `#8A5F14` auf `#F8F0DC` | Vorratsschrank |
| `olive` | Text `#4F5D27` auf `#ECEEE0` | Notvorrat (6.1:1) |

**Lagerorte haben je eine Akzentfarbe:** Kühlschrank = Rucola, Tiefkühler = Eis, Vorratsschrank = Weizen, Notvorrat = Oliv. Die PDF-Berichte nutzen dieselben Werte (Rucola, Eisberg, Linie).

## Schrift

Systemschrift nach Apples Human Interface Guidelines (ADR-0021): SF Pro auf Apple-Geräten, Roboto auf Android, Segoe UI unter Windows. Es wird nichts geladen, die Grössen in `rem` folgen der Textgrösse des Systems.

| Rolle | Grösse/Gewicht |
| --- | --- |
| Grosser Titel (`large-title`) | 34 px, 700 |
| Text und Bedienung | 17 px, 400/600 |
| Klein (Meta, Chips) | 13–14 px, 600 |

## Form, Tiefe, Bewegung

- Radien: 10 px (Segmente), 12 px (Segment-Spur), 12 px (Eingaben, Buttons), 16 px (Karten), 24 px (Sheets), Pill für Chips und Status.
- Karten ohne Rahmen, nur mit weichem Schatten (`shadow-card`); schwebende Elemente (Sheets, Toast) etwas mehr.
- Bewegung 150–200 ms, ease-out; `prefers-reduced-motion` schaltet Animationen ab.

## Icons und Lebensmittel

- **Icons:** Lucide (ISC-Lizenz), Linienstärke 1.75, 22 px in der Navigation.
- **App-Symbol** (`apps/web/public/icon.svg`): ein aufrechter weisser Rettich mit grünem Kraut auf dem App-Grün `#2c7149`.
  - **Festgelegt** (Alban, 7.11.2026): «Das vorherige Design war Welten besser, bleib dabei.» Der gekippte Entwurf «Radish Pop» aus dem Masterplan ist verworfen.
  - Nur auf Albans Auftrag neu entwerfen. PNGs neu zeichnen mit `node apps/web/scripts/icons.ts`.
- **Lebensmittel:** Emoji pro Kategorie (🥛 🧀 🥬 🍎 🥩 🐟 🍞 🥚) für schnelles Wiedererkennen in Listen, ohne Bild-Assets. Kommt mit dem Kategorien-Katalog (Schritt 2b).

## Muster (werden mit den Features gebaut)

- **Listen** (Vorrat, «Heute retten», Einkaufsliste): Apples «inset grouped» Liste. Alle Zeilen liegen in einer weissen, abgerundeten Gruppe, getrennt durch Haarlinien ab dem Text, nicht als einzelne Karten.
- **Artikelzeile:** Packungsbild oder Emoji, Name, darunter Menge · Lagerort, rechts Status-Chip («heute», «morgen», «in 3 Tagen») und «›», wenn die Zeile eine Detailseite öffnet. Der Status steht im Chip als Text, die Farbe unterstützt nur.
- **Startseite «Heute retten»:** grosse Zahl (Wert im Kühlschrank in CHF), darunter die dringendsten Artikel, Lagerorte als drei Kacheln.
- **Navigation:** weisse Leiste unten mit fünf Zielen (Start, Vorrat, ＋ Erfassen, Kochen, Mehr; ADR-0031), aktives Ziel mit Basilikum-Pill hinter dem Icon. ＋ steht in der Mitte und als einziges Icon in einem gefüllten Kreis. Unterseiten haben oben links «‹ Titel der vorigen Seite».
- **Segment-Auswahl** (2–4 kurze Optionen, z. B. «Wo ist es?»): eine graue Spur mit gleich breiten Segmenten, 13 px. Die Lagerort-Tabs im Vorrat sehen gleich aus. Das gewählte Segment ist basilikumgrün mit weisser Schrift statt iOS-weiss, damit der Zustand 3:1 Kontrast hat. Sehr lange Wörter trennen auf schmalen Handys mit Bindestrich.
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
