# Rettich – Markenbuch

> Für alle, die Rettich nach aussen zeigen: Website, Social Media, Präsentationen, auch andere KI-Werkzeuge. Die Werte stammen aus der App (`apps/web/src/index.css`, [`design.md`](design.md)) und den Entscheiden [ADR-0021](adr/0021-apple-design-language.md) (Apple-Design), [ADR-0046](adr/0046-awareness-verwertet-entsorgt.md) (verwertet/entsorgt), [ADR-0047](adr/0047-names-like-a-private-bank.md) (Namen) und [ADR-0049](adr/0049-public-repo-noindex.md) (nicht in Suchmaschinen). Stand 11.11.2026.

## 1. Kern

| | |
| --- | --- |
| **Name** | Rettich, mit grossem R, sonst klein. Gelesen als «rett' ich». Nie RETTICH, nie rettich im Text, nie mehr «FridgeAI» |
| **Claim** | «Wirf kein Geld in den Abfall.» (mit Punkt, ohne Ausrufezeichen) |
| **Ein Satz** | Rettich ist der Mitbewohner, der weiss, was im Kühlschrank ist. |
| **Was es ist** | Eine App für Schweizer Haushalte, WGs und Paare. Sie liest Quittungen, kennt den Vorrat, zeigt, was heute weg muss, und zieht Bilanz in Franken |
| **Haltung** | Rettich zählt Franken, nicht Kalorien. Eine Awareness-App, kein Ernährungstagebuch |
| **Drei Werte** | **Ruhig** (keine Alarme, kein Moralfinger) · **Genau** (Franken auf den Rappen, Fakten mit Quelle) · **Diskret** (kein Konto, der Vorrat bleibt auf dem Gerät) |

Rettich spricht wie eine gute Schweizer Privatbank: ruhig, genau, mit wenigen, klassischen Wörtern. Der Vorrat ist Geld; Rettich führt darüber Buch.

## 2. Logo

### Bildmarke

Das App-Symbol ist das Logo: ein aufrechter weisser Rettich mit grünem Kraut auf Smaragd. Vorlage: [`apps/web/public/icon.svg`](../apps/web/public/icon.svg) (512 × 512, Eckenradius 112, also rund 22 %).

| Teil | Farbe |
| --- | --- |
| Grund | Smaragd `#135E42` |
| Äussere Blätter | `#59A884` (basil-400) |
| Mittleres Blatt | `#B4E0CA` (basil-200) |
| Rübe | Elfenbein `#F8F6F1` |
| Kragen | `#D7F1E3` (basil-100) |
| Wurzelhärchen | `#D9D3C4`, Linie 7 von 512 |

- **Festgelegt** (Alban, 7.11.2026: «Das vorherige Design war Welten besser, bleib dabei.»). Neu entworfen wird nur auf Albans Auftrag.
- **Schutzraum:** rundum ein Viertel der Symbolbreite frei.
- **Mindestgrösse:** 24 px am Bildschirm, 8 mm im Druck.
- **Auf welchem Grund:** Silber, Weiss oder Onyx. Auf Fotos nur auf einer ruhigen, einfarbigen Stelle.

**Nie:**

- kippen oder drehen (der gekippte Entwurf «Radish Pop» ist verworfen);
- umfärben, Verlauf, Schatten, Rahmen, Glanz oder 3D;
- ein Gesicht, Arme oder Sprechblasen: Rettich bleibt eine Pflanze, keine Comicfigur;
- strecken, beschneiden, Teile weglassen;
- die Rübe ohne den Smaragd-Grund als Logo (ohne Grund nur als Maskottchen, siehe 2.3).

### Wortmarke und Kombination

- **Wortmarke:** «Rettich» in der Systemschrift (SF Pro auf Apple), Gewicht 700, Laufweite −1 %. Onyx auf hellem Grund, Weiss auf Smaragd oder Onyx. Für Grafiken ausserhalb von Apple-Geräten Inter 700 (OFL, siehe 4).
- **Kombination:** Bildmarke links, Wortmarke rechts, mittig auf einer Achse. Höhe der Wortmarke (Versalhöhe) gleich 40 % der Symbolhöhe, Abstand ein Viertel der Symbolhöhe.
- **Mit Claim:** Der Claim steht unter der Wortmarke, Gewicht 400, in Onyx oder Nebentext-Grau `#5B6168`, nie grösser als die Wortmarke.

### Maskottchen: dein Rettich

Auf Start wächst «Dein Rettich» mit jeder bestätigten Rettung im Monat ([ADR-0043](adr/0043-growing-rettich.md)):

| Stufe | ab Rettungen | Bild |
| --- | --- | --- |
| Samen | 0 | nur der Ring |
| Keimling | 1 | erstes Blatt |
| Jungpflanze | 3 | drei Blätter |
| Rettich | 6 | sechs Blätter |
| Vorbild | 10 | volle Pflanze, Grund Onyx statt Smaragd |

Das Maskottchen darf in Beiträgen den Fortschritt zeigen («Keimling», «Vorbild»). Es spricht nicht und hat kein Gesicht.

## 3. Farben

Drei Töne tragen die Marke: **Smaragd, Silber, Onyx** (Alban, 7.11.2026). Verteilung 60–30–10: 60 % Silber und Weiss, 30 % Onyx (Schrift und eine dunkle Fläche), 10 % Smaragd für die eine Hauptaktion oder Auszeichnung.

### Markenfarben

| Name | Wert | Wofür |
| --- | --- | --- |
| **Smaragd** | `#135E42` | Logo-Grund, Knöpfe, Links, eine Auszeichnung pro Fläche. Weiss darauf 7.8:1 |
| **Onyx** | `#0D1012` | Die eine dunkle Fläche, der ＋-Knopf, dunkle Beiträge |
| **Tinte** (Schrift) | `#14161A` | Haupttext, 16.5:1 auf Silber |
| **Silber** (Grund) | `#F3F4F6` | Seiten- und Beitragsgrund |
| **Weiss** | `#FFFFFF` | Karten auf Silber |
| **Silber ruhig** | `#E9EBED` | ruhige Flächen, Symbol-Kacheln |
| **Linie** | `#DBDEE2` | Haarlinien |
| **Silber hell** | `#BABEC4` | Schrift und Linien auf Onyx (10.2:1) |
| **Nebentext** | `#5B6168` | Quellen, Untertitel (5.7:1 auf Silber) |
| **Elfenbein** | `#F8F6F1` | nur die Rübe im Logo |

### Smaragd-Stufen

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#EEF9F3` | `#D7F1E3` | `#B4E0CA` | `#87C8A9` | `#59A884` | `#358B68` | `#207453` | `#135E42` | `#0D4A33` | `#073524` | `#031F14` |

50 für Hinweis-Karten («Wusstest du schon?»), 100 für den aktiven Tab, 300 als Akzent auf Onyx, 600 für den Fokusring, 800 für grünen Text auf hell.

### Bedeutungsfarben (nur in App-Bildern und Datengrafiken)

| Name | Schrift auf Fläche | Bedeutung |
| --- | --- | --- |
| Bald | `#8A4B0F` auf `#FFF1DF`, Akzent `#E39A3B` | läuft in 1–3 Tagen ab |
| Heute | `#A63A22` auf `#FDEBE6`, Akzent `#E0603F` | läuft heute ab |
| Entsorgt | Weiss auf `#B3261E` | entsorgt, «Nicht mehr essen» |
| Kühlschrank | Smaragd | Lagerort |
| Tiefkühler | `#2A6B8C` auf `#E6F3F8` | Lagerort |
| Vorratsschrank | `#8A5F14` auf `#F8F0DC` | Lagerort |
| Notvorrat | `#4F5D27` auf `#ECEEE0` | Lagerort |

- **Bilanz-Kreise:** «Verwertet» in Onyx, «Entsorgt» in Rot `#B3261E`.
- Rot ist nie Markenfarbe und nie grosse Fläche, ausser um «Entsorgt» zu zeigen.
- Keine Neontöne, keine Verläufe, kein reines Schwarz `#000`.
- Farbe trägt nie allein Bedeutung: Es steht immer ein Wort oder Symbol dabei.
- Jede Schrift erfüllt WCAG AA (4.5:1, grosse Schrift und Grafik 3:1).

## 4. Schrift

- **App und Website:** die Systemschrift, nichts wird geladen: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Grafiken für Social Media, Druck, Präsentationen:** **Inter** (SIL Open Font License, frei). SF Pro ist nur für Entwürfe von Apple-Software lizenziert, nicht für Werbung.
- **Keine Serifenschrift, keine Schreibschrift.**
- **Zahlen:** Tabellenziffern (`font-variant-numeric: tabular-nums`), wo Beträge untereinander stehen.

| Rolle | Grösse / Gewicht | Wo |
| --- | --- | --- |
| Grosser Titel | 34 px / 700, Zeilenabstand 1.1 | Seitentitel in der App, H1 auf der Website (Desktop bis 56 px) |
| Titel | 22 px / 700 | Abschnitte |
| Text | 17 px / 400, Zeilenabstand 1.45 | Fliesstext |
| Betont | 17 px / 600 | Zeilentitel, Knöpfe |
| Klein | 13–14 px / 600 | Meta, Chips, Quelle |
| Überschrift klein | 13 px / 600, GROSS, Laufweite +4 % | Gruppen wie «HEUTE KOCHEN» |

**Schreibweisen:**

- **Geld:** «CHF 2.10», «CHF 1’250.00». Rappen immer zweistellig, Tausender mit Apostroph, nie «2,10 Fr.» und nie «CHF 2.-».
- **Datum:** «06.11.2026» oder «Fr, 6. Nov. 2026».
- **Prozent:** «12 %» mit schmalem Leerzeichen.

## 5. Form, Raster, Bewegung

Rettich folgt Apples Human Interface Guidelines ([ADR-0021](adr/0021-apple-design-language.md)).

- **Radien:**
  - 10 px Segment;
  - 12 px Knopf, Eingabe, Segment-Spur;
  - 16 px Karte;
  - 24 px Sheet;
  - Pille für Chips;
  - App-Symbol 22 %.
- **Tiefe:** Karten weiss, ohne Rahmen, mit weichem Schatten `0 1px 2px rgb(20 22 26 / .05), 0 2px 10px rgb(20 22 26 / .05)`. Schwebendes (Sheet, Toast) `0 8px 24px rgb(20 22 26 / .1)`.
- **Listen:** «inset grouped». Zeilen in einer weissen, gerundeten Gruppe, getrennt durch Haarlinien ab dem Text.
- **Raster:** 4-px-Schritte, Seitenrand mindestens 16 px, Lesebreite rund 65 Zeichen.
- **Ausrichtung:** In einer Fläche steht alles auf einer Achse, entweder mittig oder an einer gemeinsamen Kante. Text wird nie angeschnitten.
- **Eine Hauptaktion pro Fläche,** Knopf in Smaragd mit weisser Schrift, Touch-Ziel mindestens 44 px.
- **Symbole:** [Lucide](https://lucide.dev) (ISC), Linie 1.75, runde Enden, 22–24 px. Keine Emojis in Marken-Grafiken.
- **Bewegung:** 150–200 ms, ease-out, ohne Federn und ohne Effekthascherei. `prefers-reduced-motion` schaltet Bewegung ab. Die eine Geste, die Rettich ausmacht: wischen, nach links «Verwertet» (Smaragd), nach rechts «Entsorgt» (Rot).

## 6. Bildsprache

- **App-Bilder:**
  - nur echte Screens aus der App, im iPhone-Rahmen, mit den Beispieldaten des Demo-Modus (`pnpm preview:shots`);
  - nie erfundene Funktionen zeigen;
  - nie echte Personendaten zeigen.
- **Fotos:**
  - Tageslicht, echte Küchen und Kühlschränke, Hände statt Gesichter;
  - Schweizer Alltag: Rüebli, Joghurt, Hartkäse, Brot vom Vortag;
  - ruhig und aufgeräumt.
- **Nicht:**
  - Abfallberge, Schuldbilder, grinsende Stockfoto-Familien;
  - Elendsbilder zum Thema Hunger;
  - fremde Logos prominent im Bild.
- **Hunger und Verluste** zeigen wir mit Zahlen und Quelle, nicht mit Bildern von Not.
- **Illustration:** nur die Bildmarke, das Maskottchen und Lucide-Symbole.

## 7. Sprache und Ton

**Regeln:**

1. **«du», immer eine Person:** du, dein, dir. Nie «ihr», «euch», «euer», nie «Sie», auch wenn eine WG gemeint ist.
2. **Schweizer Rechtschreibung:** «ss» statt «ß»; inklusive Schreibweise mit Doppelpunkt (Mitbewohner:innen).
3. **Ruhig:** keine Ausrufezeichen, keine Superlative, keine Grossbuchstaben zum Schreien, kein Countdown-Druck.
4. **Keine Modewörter:** Smart, Insights, Hub, Magic, Journey, Game Changer, revolutionär, KI-powered, next level, «Food Waste» im Text (siehe 8).
5. **Kein Englisch,** wo es ein gutes deutsches Wort gibt.
6. **Kein Moralfinger:** Rettich hilft, er tadelt nicht. Entsorgen ist eine Tatsache, kein Versagen.
7. **Zahlen nur mit Quelle,** Behauptungen über Rettich nur, wenn die App sie heute erfüllt (siehe 8).
8. **Kurz:** ein Gedanke pro Satz, Verben statt Substantive.

### Wortliste

| So | Nicht so |
| --- | --- |
| Quittung | Bon, Kassenzettel, Beleg |
| verwertet, verwerten | gegessen, aufgegessen, verbraucht (als Titel) |
| entsorgt, entsorgen | weggeworfen, wegwerfen, Abfall machen |
| Heute retten | Läuft ab, Dringend, Achtung |
| gerettet (selbst bestätigt) | gespart (ohne Beleg) |
| Bilanz | Statistik, Dashboard, Wirkung |
| Auszüge, Gesamtauszug | Reports, Berichte als PDF |
| Journal | Verlauf, History |
| Nachkaufen | Shopping-Liste |
| Vorrat, Kühlschrank, Tiefkühler, Vorratsschrank, Notvorrat | Inventar, Bestand, Pantry |
| Deine Daten | Account, Konto, Profil |
| Lebensmittelverluste, «im Abfall landen» | Food Waste, Foodwaste (im Text) |
| Wusstest du schon? | Fun Fact, Did you know |

### Beispielsätze

- «Wirf kein Geld in den Abfall.»
- «Rettich weiss, was du zu Hause hast, was bald abläuft und was du rettest.»
- «Quittung hochladen. Rettich liest Artikel, Preise und Laden.»
- «Heute retten: Joghurt, Spinat, Rahm.»
- «Gerettet: Joghurt, CHF 2.10.»
- «Bilanz November: 23 Artikel verwertet, 2 entsorgt.»
- «Kein Konto. Dein Vorrat bleibt auf deinem Gerät.»
- «Nichts entsorgt.» (statt «Super gemacht!»)

## 8. Fakten und Versprechen

### Fakten mit Quelle

Diese Fakten sind geprüft und stehen auch in der App («Wusstest du schon?»). Jede Zahl trägt ihre Quelle in Klammern. Neue Zahlen kommen erst mit geprüfter Quelle dazu, Belege in [`ideen/markt-und-timing.md`](ideen/markt-und-timing.md).

| Fakt | Quelle |
| --- | --- |
| Ein Schweizer Haushalt entsorgt Lebensmittel im Wert von rund CHF 600 pro Jahr. | WWF |
| Mehr als ein Viertel der vermeidbaren Lebensmittelverluste der Schweiz entsteht in den Haushalten. | BAFU |
| In der Schweiz gehen pro Person und Jahr rund 310 kg Lebensmittel vermeidbar verloren, vom Feld bis zum Teller. | BAFU |
| Die Schweiz will die vermeidbaren Lebensmittelverluste bis 2030 halbieren. Bis 2025 sanken sie erst um rund 5 %. | BAFU |
| Weltweit landen rund 19 % der Lebensmittel, die im Laden und zu Hause ankommen, im Abfall. | UNEP 2024 |
| Rund 60 % der Lebensmittel, die weltweit im Abfall landen, kommen aus Haushalten. | UNEP 2024 |
| Haushalte entsorgen weltweit jeden Tag mindestens eine Milliarde Mahlzeiten. | UNEP 2024 |
| Lebensmittelverluste und -abfälle verursachen 8 bis 10 % der weltweiten Treibhausgase. | UNEP 2024 |
| Weltweit hungerten 2024 rund 673 Millionen Menschen, etwa jeder zwölfte Mensch. | FAO 2025 |
| In Afrika hungerte 2024 mehr als jeder fünfte Mensch, rund 307 Millionen. | FAO 2025 |
| Rund 2,3 Milliarden Menschen lebten 2024 mit mässiger oder schwerer Ernährungsunsicherheit. | FAO 2025 |

Tipps ohne Zahlen (frei verwendbar): Brot vom Vortag wird zu Fotzelschnitten; Kräuter halten im Wasserglas länger; Äpfel und Bananen getrennt lagern; Fleisch und Fisch unten über das Gemüsefach; welke Rüebli in kaltem Wasser; Mindestens haltbar bis heisst nicht «entsorgen».

### Was Rettich heute kann (darf beworben werden)

- Quittungen von Coop, Migros, Aldi, Lidl und Denner hochladen (PDF, Screenshot, Foto), auf dem Gerät auslesen, in den Vorrat legen.
- Barcode scannen, Produkt suchen, Artikel mit dem Namen erfassen; Ablaufdatum wird vorgeschlagen.
- Vorrat nach Kühlschrank, Tiefkühler, Vorratsschrank und Notvorrat.
- «Heute retten»: was in den nächsten drei Tagen abläuft.
- Wischen: verwertet oder entsorgt, mit «Rückgängig».
- Bilanz in Franken, Auszüge als PDF wie ein Kontoauszug, Journal.
- Nachkaufen: ein Satz wird zur Liste, auch diktiert.
- Wissen: Haltbarkeit A–Z, «Kurz erklärt», Rezepte mit «Da» und «Fehlt».
- Kein Konto, offline nutzbar, Daten exportieren und löschen.

### Was wir nicht behaupten

- **«Spare CHF 600 mit Rettich»:** Die CHF 600 sind der Verlust eines Durchschnittshaushalts (WWF), keine gemessene Ersparnis.
- **«Nichts verlässt dein Gerät»:** Barcode und Produktsuche fragen Open Food Facts. Richtig ist: «Kein Konto. Dein Vorrat bleibt auf deinem Gerät. Quittungen liest Rettich auf dem Gerät.»
- **Noch nicht vorhanden:** Erinnerungen, Widgets, App Store und Google Play, Teilen und Abrechnen im Haushalt, KI-Assistent.
- **Keine Partnerschaft** mit Läden oder Organisationen andeuten.
- **Keine Nutzerzahlen und keine Bewertungen,** solange es keine gemessenen gibt.

## 9. Läden und fremde Marken

- Läden werden **nur beschreibend** genannt («liest Quittungen von Coop, Migros, Aldi, Lidl und Denner»), nie als Partner, nie mit ihren Logos.
- Die **Laden-Buchstaben** der App (ein Buchstabe in der Farbe des Schilds) erscheinen nur in echten App-Screens neben dem Ladennamen, nie als eigene Grafik, nie gross, nie in Titeln.
- Mitbewerber (Too Good To Go, YAZIO, Open Food Facts) werden nicht schlechtgemacht. Open Food Facts wird als Quelle genannt, wo seine Daten zu sehen sind.

## 10. Website

Für die KI, die die Website baut.

- **Ort:** nicht in diesem Repo ([ADR-0049](adr/0049-public-repo-noindex.md)), eigenes Projekt, Hosting im Gratis-Plan.
- **Domain:** offen, Alban entscheidet (`docs/ideen/` Domain-Prüfung). Bis dahin ein Platzhalter.
- **Nicht in Suchmaschinen,** bis Alban den öffentlichen Start freigibt: `<meta name="robots" content="noindex, nofollow">` und Kopfzeile `X-Robots-Tag: noindex, nofollow`.
- **Keine Adresse der App, kein Link zur App,** kein Knopf «Jetzt starten». Der Zugang zum Pilot läuft persönlich über Alban. Statt Download: «Rettich ist im Pilot. Bald für alle.»
- **Keine Daten sammeln:**
  - kein Formular, keine Warteliste, kein Newsletter ohne Albans OK und Datenschutzerklärung (neuer Datenfluss);
  - keine Cookies, kein Tracking, kein Google Analytics, keine Pixel;
  - keine Schriften und Skripte von fremden Servern.
- **Pflichtseiten:** Impressum und Datenschutzerklärung. Name und Adresse liefert Alban, bis dahin Platzhalter.
- **Technik:**
  - statisch und schnell;
  - WCAG 2.2 AA;
  - auf 390 px Breite ohne seitliches Scrollen;
  - hell als Standard, dunkel optional: Grund Onyx, Schrift `#BABEC4`, Akzent `#87C8A9`.

**Vorgeschlagener Aufbau:**

1. **Kopf:** Bildmarke und Wortmarke links.
2. **Erster Bildschirm:**
   - Claim als grosser Titel, darunter der Satz «Rettich weiss, was du zu Hause hast, was bald abläuft und was du rettest. Alles bleibt auf deinem Gerät.»;
   - rechts ein iPhone mit dem Start-Screen.
3. **So funktioniert Rettich,** drei Schritte wie in der App:
   - Quittung hochladen;
   - Vorrat im Blick;
   - Verwerten statt entsorgen.
4. **Was Rettich kann:** sechs Karten aus der Liste in 8, je mit einem Lucide-Symbol.
5. **Bilanz:** die zwei Kreise «Verwertet» und «Entsorgt» als Bild aus der App.
6. **Deine Daten:** «Kein Konto. Dein Vorrat bleibt auf deinem Gerät. Exportieren und löschen jederzeit.»
7. **Wusstest du schon?:** drei Fakten mit Quelle, auf `#EEF9F3`.
8. **Fuss:** Impressum, Datenschutz, «© 2026 Alban Hyseni».

## 11. Social Media

Für die KI, die die Auftritte führt.

- **Konten:** Instagram, TikTok und LinkedIn eröffnet Alban (Name, Ausweis). Bezahlte Werbung nur mit seinem OK.
- **Freigabe:** Die ersten zehn Beiträge gibt Alban frei, danach Stichproben.
- **Keine Personendaten:**
  - keine Screens mit echten Daten;
  - keine Inhalte von Nutzer:innen ohne schriftliches Einverständnis.

**Vier Rubriken:**

1. **Wusstest du schon?**
   - Ein Fakt aus 8 mit Quelle.
   - Grund Silber `#F3F4F6`.
   - Kopf «Wusstest du schon?» in Smaragd, 600.
   - Fakt in Tinte, 700.
   - Quelle in `#5B6168`.
   - Bildmarke unten links.
2. **Retten statt entsorgen:**
   - ein Tipp ohne Zahl oder ein Resten-Rezept aus der App (Fotzelschnitten, Älplermagronen);
   - Foto oder ruhige Typo-Karte.
3. **Bilanz:**
   - eine Monatsbilanz im Quittungs-Look mit den zwei Kreisen;
   - immer mit «Beispiel» beschriftet, solange es keine echte, freigegebene ist.
4. **Aus der Werkstatt:** neue Funktionen als echter Screen mit einem Satz dazu.

**Formate:**

| Format | Grösse | Hinweis |
| --- | --- | --- |
| Beitrag | 1080 × 1350 (4:5) | Rand 80 px |
| Story, Reel, TikTok | 1080 × 1920 (9:16) | oben 250 px und unten 340 px frei für die Bedienelemente |
| LinkedIn | 1200 × 627 | Rand 64 px |

**Text der Beiträge:**

- Die Regeln aus 7 gelten.
- Höchstens drei Sätze.
- Keine Emojis.
- Hashtags am Ende, höchstens fünf; dort dürfen gängige Begriffe stehen (#foodwaste, #lebensmittelretten, #schweiz), im Text nicht.
- **Antworten auf Kommentare:**
  - mit «du», ruhig, sachlich;
  - keine Politik, keine Diskussion über einzelne Läden;
  - Fragen zum Datenschutz mit dem Satz aus 8 beantworten.

## 12. Auftrag zum Kopieren

**Website:**

> Baue eine statische Website für «Rettich», eine App für Schweizer Haushalte gegen Lebensmittelverluste. Halte dich vollständig an das Markenbuch `docs/marke.md` im Repo BanioX/FridgeAI. Pflicht:
>
> - Farben Smaragd `#135E42`, Silber `#F3F4F6` und Onyx `#0D1012`, Systemschrift, Logo aus `apps/web/public/icon.svg`.
> - Deutsch (Schweiz), «du», «ss», keine Ausrufezeichen, keine Modewörter.
> - `noindex, nofollow`, keine Adresse und kein Link zur App, kein Formular, keine Cookies, kein Tracking, keine fremden Schriften.
> - Impressum und Datenschutz mit Platzhaltern.
> - Nur Funktionen aus Abschnitt 8, nur Fakten mit Quelle.

**Social Media:**

> Plane und gestalte Beiträge für «Rettich» (Instagram, TikTok, LinkedIn) nach dem Markenbuch `docs/marke.md` im Repo BanioX/FridgeAI. Vier Rubriken: Wusstest du schon?, Retten statt entsorgen, Bilanz, Aus der Werkstatt. Pflicht:
>
> - Deutsch (Schweiz), «du», «ss», keine Ausrufezeichen, keine Emojis, keine Modewörter.
> - Jede Zahl mit Quelle aus Abschnitt 8.
> - Logo nie verändern; Schrift Inter.
> - Keine Läden-Logos, keine Partnerschaft andeuten, keine Personendaten.
> - Die ersten zehn Beiträge legst du Alban zur Freigabe vor.
