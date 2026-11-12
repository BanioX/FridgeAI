# Rettich – Abzeichen-Katalog

> Alban, 11.11.2026: «Man kann auch Abzeichen gewinnen wie Koch, Sparsam, Überlebenskünstler. Das könnte Leuten gefallen.» Dieser Katalog legt fest, welche Abzeichen es gibt, wofür und wie sie aussehen. Gebaut seit 12.11.2026 (Runde 2, [ADR-0054](adr/0054-achievements.md)), bis auf «Gemeinsam»; siehe [`ideen/komfort-und-geld.md`](ideen/komfort-und-geld.md).

## Grundsätze

1. **Belohnt wird Retten, nicht Kaufen.** Kein Abzeichen zählt Einkäufe, gescannte Artikel oder ausgegebenes Geld. So lockt Rettich nie zum Mehrkaufen.
2. **Nur Bestätigtes zählt:**
   - verwertet, entsorgt, gerettet, eingefroren, gekocht, so wie du es selbst eingetragen hast;
   - was du rückgängig machst, zählt nicht mehr.
3. **Berechnet, nicht gespeichert:**
   - Rettich rechnet die Abzeichen jedes Mal aus deinen Daten auf dem Gerät;
   - löschst du deine Daten, sind auch die Abzeichen weg (ADR-0020);
   - es geht nichts ins Netz.
4. **Kein Druck, kein Vergleich:**
   - keine Ranglisten, kein Vergleich mit anderen;
   - keine Mitteilung, kein «Serie verloren»;
   - eine unterbrochene Folge heisst einfach «diese Woche noch offen».
5. **Ruhig gesagt:**
   - beim Freischalten ein kurzer Hinweis wie «Neues Abzeichen: Resteküche.», ohne Ausrufezeichen und ohne Konfetti;
   - Namen sind neutral und passen für alle.
6. **Ehrliche Schwellen:** Monatsabzeichen gelten nur für abgeschlossene Monate mit mindestens 10 Abschlüssen (verwertet oder entsorgt). Ein leerer Monat ist kein sparsamer Monat.

## Aussehen

- **Medaille:** rund, 56 px, darin ein Lucide-Symbol (Linie 1.75). Name darunter, 13 px, 600.
- **Stufen:** Viele Abzeichen haben drei Stufen.

  | Stufe | Ring | Grund | Wie beim Maskottchen |
  | --- | --- | --- | --- |
  | I | Silber `#BABEC4` | Weiss | |
  | II | Smaragd `#135E42` | `basil-50` | |
  | III | Onyx `#0D1012` | Onyx, Symbol weiss | wie «Vorbild» |

  Einmalige Abzeichen nutzen Stufe II.
- **Noch offen:** Ring gestrichelt in Silber, Symbol in `ink-muted`, darunter der Fortschritt («noch 3 Rettungen»). Ein Fortschrittsbogen im Ring zeigt, wie viel fehlt.
- **Ort:**
  - auf Start unter «Dein Rettich» die drei zuletzt freigeschalteten;
  - unter «Mehr» die Seite «Abzeichen» mit allen, nach Familie geordnet.
- **Barrierefrei:** Jede Medaille hat einen Text wie «Resteküche, Stufe II, freigeschaltet am 4.12.2026». Fortschritt steht als Text, nicht nur als Bogen.

## Katalog

**Spalte «Ab»:**

- **heute:** Die Daten dafür gibt es schon.
- **R2:** Es braucht zuerst «Verarbeiten» und «Gekocht» (Runde 2).
- **neu:** Es braucht ein neues lokales Ereignis.
- **später:** Es braucht «Haushalt teilen».

### Retten

| Abzeichen | Wofür | Stufen I · II · III | Symbol | Ab |
| --- | --- | --- | --- | --- |
| **Erste Rettung** | Das erste Mal etwas gerettet (verwertet, als es knapp wurde) | einmalig | `Sprout` | heute |
| **Rettungsdienst** | Bestätigte Rettungen insgesamt | 10 · 50 · 200 | `LifeBuoy` | heute |
| **Sparbuch** | Wert, den du gerettet hast | CHF 20 · CHF 100 · CHF 500 | `PiggyBank` | heute |
| **Auf den letzten Tag** | Am Ablauftag verwertet | 5 · 20 · 50 | `CalendarClock` | heute |
| **Mit allen Sinnen** | Nach dem Mindesthaltbarkeitsdatum geprüft und verwertet (nie bei Verbrauchsdatum) | 3 · 10 · 30 | `ScanEye` | heute |

### Bilanz

| Abzeichen | Wofür | Stufen I · II · III | Symbol | Ab |
| --- | --- | --- | --- | --- |
| **Sparsam** | Ein abgeschlossener Monat mit weniger als 5 % entsorgt, nach Wert | 1 · 3 · 6 Monate | `Coins` | heute |
| **Nichts entsorgt** | Ein abgeschlossener Monat ganz ohne Entsorgtes | 1 · 3 · 6 Monate | `CircleCheck` | heute |
| **Fortschritt** | Letzter Monat weniger entsorgt als im ersten Monat (ADR-0050) | −25 % · −50 % · −75 % | `TrendingDown` | heute |
| **Jahresabschluss** | Ein Jahr mit Rettich, gerechnet ab dem ersten Abschluss | einmalig | `CalendarCheck` | heute |

### Kochen und Verarbeiten

| Abzeichen | Wofür | Stufen I · II · III | Symbol | Ab |
| --- | --- | --- | --- | --- |
| **Am Herd** | Rezepte gekocht («Gekocht» auf der Rezeptseite) | 1 · 10 · 50 | `CookingPot` | R2 |
| **Backstube** | Etwas gebacken (Verarbeiten zu Brot, Zopf, Kuchen, Gebäck) | 1 · 5 · 20 | `Croissant` | R2 |
| **Resteküche** | Reste verwertet | 5 · 20 · 50 | `Soup` | R2 |
| **Eigenes Kochbuch** | Eigene Rezepte gespeichert («Meine Rezepte») | 1 · 5 · 20 | `BookOpen` | heute, sobald «Meine Rezepte» gemergt ist |

### Vorrat

| Abzeichen | Wofür | Stufen I · II · III | Symbol | Ab |
| --- | --- | --- | --- | --- |
| **Vorausschauend** | Vor dem Datum eingefroren | 5 · 20 · 50 | `Snowflake` | heute |
| **Alles im Blick** | 30 Tage lang kein Artikel im Kühlschrank über sein Datum gekommen | einmalig | `Eye` | heute |
| **Treu** | Kühlschrank-Check Woche für Woche | 4 · 12 · 52 Wochen in Folge | `ClipboardCheck` | neu: Ereignis «Check abgeschlossen» |
| **Überlebenskunst** | Notvorrat nach der Empfehlung des Bundes (BWL): Trinkwasser für drei Tage und Haltbares für eine Woche | einmalig | `Tent` | heute |
| **Buchhaltung** | Quittungen übernommen | 1 · 10 · 50 | `ReceiptText` | heute |

### Haushalt (später)

| Abzeichen | Wofür | Stufen | Symbol | Ab |
| --- | --- | --- | --- | --- |
| **Gemeinsam** | Alle im Haushalt haben im selben Monat etwas gerettet | einmalig | `Users` | später |

## Regeln im Detail

- **Rettung:** wie in ADR-0039. Verwertet, als der Artikel knapp war (innert der «läuft bald ab»-Tage oder über dem Mindesthaltbarkeitsdatum), und von dir bestätigt.
- **Sparbuch:** Summe `valueRappen` der Rettungen, in Rappen gerechnet (ADR-0019). Geschätzte Werte zählen mit.
- **Auf den letzten Tag:** Abschlusstag (Europe/Zurich) gleich Ablaufdatum, Ergebnis verwertet.
- **Mit allen Sinnen:** `expiryKind` ist `best_before`, Abschluss nach dem Datum, Ergebnis verwertet.
- **Sparsam und Nichts entsorgt:**
  - nur abgeschlossene Kalendermonate, mindestens 10 Abschlüsse;
  - Sparsam: Anteil nach Wert;
  - Stufen zählen solche Monate insgesamt, nicht in Folge.
- **Fortschritt:** gleiche Rechnung wie «Seit deinem ersten Monat» (ADR-0050). Die Stufe richtet sich nach dem besten erreichten Monat.
- **Vorausschauend:** Umlagern in den Tiefkühler, als das Datum noch nicht vorbei war (`frozenOn` ≤ Ablaufdatum vor dem Einfrieren).
- **Alles im Blick:** In 30 aufeinanderfolgenden Tagen ist kein Kühlschrank-Artikel offen über sein Datum geblieben und keiner mit Grund «abgelaufen» entsorgt worden. Es braucht mindestens 10 Abschlüsse im Zeitraum.
- **Treu:** Pro Kalenderwoche (Montag bis Sonntag) mindestens ein abgeschlossener Kühlschrank-Check. Dafür kommt das lokale Ereignis `check.completed` dazu.
- **Überlebenskunst:**
  - Im Notvorrat liegen Trinkwasser von mindestens 9 Litern pro Person (BWL: 9 l für drei Tage);
  - dazu Haltbares aus mindestens vier der Gruppen Reis oder Teigwaren, Öl oder Fett, Konserven, Mehl und Fertiges für eine Woche.
  - Personen = Mitglieder des Haushalts.
  - Quellen:
    - [Kanton Zürich, Wasser und Getränke](https://www.zh.ch/de/wirtschaft-arbeit/wirtschaftliche-landesversorgung/notvorrat/wasser.html);
    - [BWL, «Kluger Rat – Notvorrat»](https://stadtwerk.winterthur.ch/dam/jcr:4c48f620-f814-4f90-98fb-5382d455ed88/Broschuere-vom-Bund-Kluger-Rat-Notvorrat.PDF).
- **Buchhaltung:** übernommene Quittungen (`receipt.imported`), ohne Doppelte.
- **Am Herd, Backstube, Resteküche:** aus den Ereignissen von «Verarbeiten» und «Gekocht» (Runde 2):
  - Backstube zählt Ergebnisse in den Gebäck-Kategorien;
  - Resteküche zählt verwertete Artikel mit Herkunft «Reste».

## Umsetzung (Runde 2)

**Gebaut (12.11.2026, [ADR-0054](adr/0054-achievements.md)):** alle 18 Abzeichen ausser «Gemeinsam» (später, braucht «Haushalt teilen»). Entschieden werden musste:

- **Fortschritt:** ganze Prozent wie in der Bilanz; die 10 Abschlüsse gelten für den verglichenen Monat, nicht für den Grundmonat.
- **Alles im Blick:** zählt Artikel, die jetzt im Kühlschrank liegen; Mindesthaltbarkeits- und Verbrauchsdatum zählen gleich.
- **Treu:** Die Stufe folgt der längsten Folge, der Fortschritt der laufenden.
- **Überlebenskunst:** Wasser nur aus der Kategorie «Trinkwasser-Vorrat», fünf Gruppen auf Kategorien abgebildet, nur die Vielfalt (keine Mengen); wird der Vorrat verbraucht, ist es wieder offen.
- **Gekocht und Verarbeiten:** ein Ereignis gilt nur, solange sein Ergebnis oder seine Zutaten-Ausgänge nicht rückgängig gemacht oder gelöscht sind.
- **Neu:** Ereignis `check.completed`, `item.moved` mit `previousExpiresOn`.

- **Core:**
  - Die reine Funktion `achievements(input, today)` liefert pro Abzeichen Stufe, Datum der Freischaltung und Fortschritt.
  - Die Abfrage `stats.achievements` liegt im Anwendungsteil (ADR-0034).
  - Tests decken jede Schwelle und jedes Rückgängig ab.
- **Web:**
  - Medaillen-Komponente, Abschnitt auf Start, Seite «Abzeichen» unter «Mehr»;
  - ein ruhiger Hinweis beim Freischalten, wenn eine neue Stufe dazukommt;
  - der Vergleich läuft mit dem letzten Stand im Arbeitsspeicher, nicht gespeichert.
- **Texte:** alle Namen und Sätze im Textkatalog, geprüft vom Wörter-Test.
