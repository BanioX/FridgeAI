# Rettich – Design-System

> **Leitbild (Alban, 6.11.2026):** grün, food-freundlich, elegant und funktional. Seit 7.11.2026 premium: Smaragd, Silber, Onyx.
> Umsetzung: Tokens in `apps/web/src/index.css` (`@theme`), Komponenten in `apps/web/src/ui/`.

## Haltung

- **Premium statt laut:** Smaragd als Markenfarbe, Silber als Grund, Onyx für Schrift und den einen dunklen Akzent, viel Weissraum. Keine Neon-Töne, keine Verläufe.
- **Funktion vor Dekor:** Farbe trägt Bedeutung. Grün = frisch/ok, Aprikose = bald, Tomate = heute, Rot = nicht mehr essen. Jede Farbaussage hat zusätzlich Text oder Symbol (nie nur Farbe, wegen Farbsehschwäche).
- **Elegant durch Typografie:** Eine weiche Serifenschrift für Titel und grosse Zahlen (CHF gerettet), eine klare Sans für alles Bedienbare.
- **Daumenfreundlich:** Wichtige Aktionen unten, Touch-Ziele mindestens 44 px, eine Hauptaktion pro Screen.
- **Immer sauber ausgerichtet** (Alban, 7.11.2026: «Clean UI»): In einer Fläche steht alles auf derselben Achse, entweder mittig oder an einer gemeinsamen Kante, nie etwas mittig und etwas unten. Text wird nie angeschnitten: Was nicht ganz Platz hat, erscheint erst, wenn es passt (z. B. nur das Symbol). Das gilt auch in Bewegung, etwa beim Wischen. Jede Vorschau für Alban wird darauf geprüft.

## Farben

### Drei Premium-Töne: Smaragd, Silber, Onyx (7.11.2026)

Alban: «ein Premium-Grün und Premium-Silber oder Premium-Schwarz, diese drei Töne». Sie ersetzen die fünf Gartengrüns vom selben Tag (ADR-0035).

| Ton | Wert | Token | Wofür |
| --- | --- | --- | --- |
| **Smaragd** | `#135E42` | `basil-700` | Was du tippst und was gewählt ist: Knöpfe, gewähltes Segment, aktiver Tab, Links. Weiss darauf 7.8:1 |
| **Silber** | `#F3F4F6` · `#E9EBED` · `#DBDEE2` · `#BABEC4` | `oat`, `surface-muted`, `line`, `silver` | Grund, ruhige Flächen, Haarlinien. Silberschrift nur auf Onyx (10.2:1) |
| **Onyx** | `#0D1012` · Text `#14161A` | `onyx`, `ink` | Haupttext (16.5:1) und die eine dunkle Karte pro Seite (Wert im Kühlschrank auf Start), dazu der ＋-Knopf |

**So sind sie gebaut:**

- **Smaragd** ist ein tiefes, leicht bläuliches Grün (OKLCH, Farbton 163°). Seine Stufen von `basil-50` bis `basil-950` sind in OKLCH gerechnet, mit gleichmässigen Helligkeitsschritten und ohne Neon:

  | Stufe | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 800 | 900 | 950 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Wert | `#EEF9F3` | `#D7F1E3` | `#B4E0CA` | `#87C8A9` | `#59A884` | `#358B68` | `#207453` | `#0D4A33` | `#073524` | `#031F14` |

  50 für Hinweis-Karten, 100 für den aktiven Tab, 600 für den Fokusring (5.2:1), 800 für grünen Text.
- **Silber** ist ein kühles Grau mit einem Hauch Blau (Farbton 255°). Es wirkt wie gebürstetes Metall und lässt Smaragd leuchten.
- **Onyx** ist ein weiches Schwarz statt reinem `#000`, das auf Bildschirmen hart wirkt.
- **60–30–10:**
  - 60 % Silber und Weiss.
  - 30 % Onyx-Schrift und die eine dunkle Karte.
  - 10 % Smaragd für die Hauptaktion.
- **Das Logo** behält die Form des ersten Designs. Sein Grund ist seit 7.11.2026 Smaragd `#135E42` (Albans Wahl «A»), das Kraut liegt in `basil-400` und `basil-200`.

Alle Text-/Hintergrund-Paare erfüllen WCAG AA (mindestens 4.5:1, Grafik 3:1), geprüft beim Festlegen.

### Neutrale und Status

**Moderner Look (7.11.2026):** Karten sind weiss ohne Rahmen mit weichem Schatten. Grün steht nur dort, wo du etwas tippst oder etwas gewählt ist, und in Hinweis-Karten (`basil-50`).

| Token | Wert | Verwendung |
| --- | --- | --- |
| `oat` (Hintergrund) | `#F3F4F6` (Silber) | App-Hintergrund, Statusleiste |
| `surface` | `#FFFFFF` | Karten, Navigation |
| `surface-muted` | `#E9EBED` | Segment-Spur, Symbol-Kacheln, Infokästen |
| `line` | `#DBDEE2` | Haarlinien, Ränder von Eingaben |
| `silver` | `#BABEC4` | Schrift und Linien auf Onyx |
| `ink` | `#14161A` | Haupttext (16.5:1) |
| `ink-muted` | `#5B6168` | Nebentext (5.7:1 auf `oat`) |
| `onyx` | `#0D1012` | Die dunkle Karte, der ＋-Knopf |
| `soon` | Text `#8A4B0F` auf `#FFF1DF`, Akzent `#E39A3B` | läuft in 1–3 Tagen ab |
| `today` | Text `#A63A22` auf `#FDEBE6`, Akzent `#E0603F` | läuft heute ab / MHD abgelaufen |
| `danger` | Weiss auf `#B3261E` | Verbrauchsdatum abgelaufen: «Nicht mehr essen» |
| `ice` | Text `#2A6B8C` auf `#E6F3F8` | Tiefkühler |
| `wheat` | Text `#8A5F14` auf `#F8F0DC` | Vorratsschrank |
| `olive` | Text `#4F5D27` auf `#ECEEE0` | Notvorrat (6.1:1) |

**Lagerorte haben je eine Akzentfarbe:** Kühlschrank = Smaragd, Tiefkühler = Eis, Vorratsschrank = Weizen, Notvorrat = Oliv. Die PDF-Berichte nutzen dieselben Werte (Smaragd, `basil-50`, Linie).

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
- **Wischen wie bei Spotify** (7.11.2026, beidseitig seit 8.11.2026, `SwipeAction`): In Vorrat und «Läuft bald ab» zieht ein Wisch nach links das Zeilen-Bild weg und zeigt einen basil-700-Streifen («Verwertet»); ein Wisch nach rechts zeigt links einen roten Streifen (`danger`) mit Abfalleimer und «Entsorgt». Am Auslösepunkt (40 %) wird das Symbol grösser und das Handy tickt kurz, so spürst du, ab wann Loslassen zählt. Darin stehen Häkchen, «Verwertet» und klein «−1» untereinander und immer mittig in der freien Fläche; unter 6 rem Breite steht nur das Häkchen, damit kein Text angeschnitten wird. Der Inhalt der Zeile blendet beim Wegziehen bis auf 30 % aus, damit sein angeschnittener Rand nicht mit der Aktion konkurriert. Ab 40 % der Zeilenbreite oder mit schnellem Wisch zählt es (Haptik 15 ms, das Bild fällt in zwei Hälften auseinander, 350 ms), sonst federt die Zeile zurück. Ein Tipp öffnet weiter den Artikel, ein Wisch nie. Stück: 1, Gramm und Milliliter: der Rest (bis es Portionsgrössen im Katalog gibt). Ein Toast über der Tab-Leiste bietet «Rückgängig» für 5 Sekunden. Der Wisch ist nur eine Abkürzung: Die Artikelseite behält die Knöpfe (WCAG 2.5.1), die Zeile bekommt keinen zusätzlichen Knopf. Mit `prefers-reduced-motion` entfallen Hälften und Federn.

## Icons und Lebensmittel

- **Icons:** Lucide (ISC-Lizenz), Linienstärke 1.75, 22 px in der Navigation.
- **App-Symbol** (`apps/web/public/icon.svg`): ein aufrechter weisser Rettich mit grünem Kraut auf Smaragd `#135e42`. Die PNG-Symbole entstehen mit `node scripts/icons.ts`.
  - **Festgelegt** (Alban, 7.11.2026): «Das vorherige Design war Welten besser, bleib dabei.» Der gekippte Entwurf «Radish Pop» aus dem Masterplan ist verworfen.
  - Nur auf Albans Auftrag neu entwerfen. PNGs neu zeichnen mit `node apps/web/scripts/icons.ts`.
- **Lebensmittel:** Emoji pro Kategorie (🥛 🧀 🥬 🍎 🥩 🐟 🍞 🥚) für schnelles Wiedererkennen in Listen, ohne Bild-Assets. Kommt mit dem Kategorien-Katalog (Schritt 2b).

## Muster (werden mit den Features gebaut)

- **Listen** (Vorrat, «Heute retten», Einkaufsliste): Apples «inset grouped» Liste. Alle Zeilen liegen in einer weissen, abgerundeten Gruppe, getrennt durch Haarlinien ab dem Text, nicht als einzelne Karten.
- **Artikelzeile:** Packungsbild oder Emoji, Name, darunter Menge · Lagerort, rechts Status-Chip («heute», «morgen», «in 3 Tagen») und «›», wenn die Zeile eine Detailseite öffnet. Der Status steht im Chip als Text, die Farbe unterstützt nur.
- **Startseite «Heute retten»:** grosse Zahl (Wert im Kühlschrank in CHF), darunter die dringendsten Artikel, Lagerorte als drei Kacheln.
- **Navigation:** weisse Leiste unten mit fünf Zielen (Start, Vorrat, ＋ Erfassen, Kochen, Mehr; ADR-0031), aktives Ziel mit hellgrüner Pill (`basil-100`) hinter dem Icon. ＋ steht in der Mitte und als einziges Icon in einem gefüllten Onyx-Kreis. Unterseiten haben oben links «‹ Titel der vorigen Seite».
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
