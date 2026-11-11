# Rettich – Use Cases (Brainstorming)

> **Status:** Brainstorming zur Diskussion, Stand 6. November 2026.
> **Nachtrag 9.11.2026:** Was davon gebaut ist, steht im [Plan](./plan.md#stand-nach-200-prs). Ein Abschluss heisst heute «Verwertet» oder «Entsorgt», «Weitergegeben» gibt es nicht mehr ([ADR-0046](adr/0046-awareness-verwertet-entsorgt.md)); die Rezepte sind seit dem 11.11.2026 wieder da, unter «Wissen» ([ADR-0048](adr/0048-recipes-return-under-wissen.md)).
> **Quellen:** [`brief.md`](./brief.md), Blue-Ocean-Analyse (6.11.2026), ATL1 «Unternehmensführung» (Okt. 2025), Businessplan ATL2 (März 2026). Zusammenfassung in [`blue-ocean.md`](./blue-ocean.md).

## Leitplanken fürs Brainstorming

Jeder Use Case muss mindestens eines dieser drei Ziele erfüllen:

1. **Übersicht:** Ich weiss jederzeit, was im Kühlschrank, Tiefkühler und Vorrat liegt.
2. **Kein Waste:** Die App sorgt dafür, dass ich es esse, weitergebe oder rechtzeitig einfriere.
3. **Partner-fähig:** Die Funktion lässt sich später über API oder MCP mit Partnern verbinden und monetarisieren.

Und er darf das Erfassen **nicht mühsamer** machen. Laut Blue-Ocean-Analyse ist Erfassungsmüdigkeit das Risiko Nr. 1: Vorrats-Apps sterben, wenn das Eintragen nervt, und ein veralteter Vorrat macht jede Erinnerung wertlos.

**Legende Phase:**
- **MVP**: steht schon im Brief
- **MVP+**: mein Vorschlag, klein, braucht deine Freigabe
- **v1**: nach dem Pilot
- **Vision**: später, meist mit Partnern

## Personas (fiktiv)

| Persona | Situation | Was sie will |
| --- | --- | --- |
| **Lena, 23**, WG mit 3 Personen | Studentin, knappes Budget | Wissen, wem was gehört, kein Streit ums Geld |
| **Marco & Sara**, Paar | Beide Vollzeit, kochen abends | Schnell sehen, was weg muss, und was es heute gibt |
| **Familie Keller**, 2 Kinder | Grosseinkauf am Samstag | Budget, Organisation, weniger wegwerfen |
| **Gemeinde Volketswil** *(B2B2C)* | Hat ein Food-Waste-Ziel bis 2030 | Gemessene Wirkung einer Kampagne |
| **Partner** *(Händler, Lieferdienst, Rezeptplattform)* | Will Kund:innen binden | Relevanter Zeitpunkt für ein Angebot |

---

## 1. Übersicht: Wissen, was da ist

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| UC-01 | **Startseite «Heute retten»**: oben, was heute und morgen abläuft, darunter die drei Lagerorte | Übersicht in 2 Sekunden | MVP+ |
| UC-02 | **«Was haben wir?»** unterwegs im Laden, auch offline | Keine Doppelkäufe | MVP |
| UC-03 | **Wert im Kühlschrank** in CHF (Summe aller aktiven Artikel) | Macht Waste greifbar | MVP+ |
| UC-04 | **30-Sekunden-Kühlschrank-Check** einmal pro Woche: Karten wischen «noch da / weg / halb» | Vorrat bleibt aktuell, ohne viel Aufwand | MVP+ |
| UC-05 | Quittungs-Foto, Migros-CSV, Coop-PDF | Erfassen ohne Tippen | MVP |
| UC-06 | Einkaufsliste abhaken → landet im Vorrat | Zweiter automatischer Weg | MVP |
| UC-07 | **Standardartikel mit 1 Tap** (Milch, Brot, Eier aus dem eigenen Verlauf) | Schnellste manuelle Erfassung | MVP+ |
| UC-08 | Tiefkühler mit «eingefroren am» und neu berechneter Haltbarkeit | Tiefkühler-Friedhof vermeiden | MVP |
| UC-09 | Spracheingabe «2 Joghurt, 1 Milch» | Hände frei beim Einräumen | v1 (Datenschutz: Spracherkennung im Browser schickt Audio oft in die Cloud) |
| UC-10 | Foto vom offenen Kühlschrank → KI erkennt Artikel | Null-Aufwand-Erfassung | Vision (Server-KI, Opt-in) |
| UC-11 | Hardware-Modul oder Smart Fridge erfasst automatisch (Idee aus ATL1/ATL2) | Vollautomatik | Vision |

## 2. Erinnern & Retten: Push-Benachrichtigungen

**Grundsatz:** Wenige, gute Benachrichtigungen statt Dauerfeuer. Wer zu viele Pushes bekommt, schaltet sie ab, und dann ist die wichtigste Funktion weg. Deshalb standardmässig **ein täglicher Digest** plus nur dringende Einzel-Pushes. Ruhezeit 22 bis 7 Uhr.

| # | Auslöser | Beispieltext | Phase |
| --- | --- | --- | --- |
| P-01 | **Täglicher Retten-Digest** (Zeit wählbar, Default 17:30, vor dem Znacht) | «Heute retten: Joghurt (morgen), Spinat (in 2 Tagen). Idee: Spinat-Omelette.» | MVP+ (ersetzt Einzel-Pushes 3 und 1 Tag vorher als Default, die bleiben einstellbar) |
| P-02 | Verbrauchsdatum heute erreicht | «Hackfleisch: heute letzter Tag. Heute braten oder jetzt einfrieren.» | MVP+ (hohe Priorität, Lebensmittelsicherheit) |
| P-03 | **Einfrier-Tipp**, wenn ein einfrierbarer Artikel bald abläuft | «Poulet läuft morgen ab. Eingefroren hält es rund 3 Monate.» | MVP+ |
| P-04 | Rette-Kreis: jemand gibt etwas frei | «Lena gibt Mozzarella frei (läuft morgen ab). Übernehmen?» | MVP |
| P-05 | Kostenteilung: neue Quittung im Haushalt | «Marco hat einen Coop-Quittung erfasst. Dein Anteil: CHF 12.40.» | MVP |
| P-06 | Wochenrückblick (Sonntagabend) | «Diese Woche gerettet: CHF 23.50 / 1.4 kg. Weggeworfen: 1 Salat.» | MVP+ |
| P-07 | Lange im Tiefkühler | «Seit 5 Monaten im Tiefkühler: Erbsen.» | v1 |
| P-08 | Einkaufsliste geändert (Opt-in) | «Sara hat 3 Artikel auf die Liste gesetzt.» | v1 |
| P-09 | Quittungs-Erinnerung nach typischem Einkaufsmuster (keine Standortdaten) | «Warst du heute einkaufen? Quittung scannen dauert 20 Sekunden.» | v1 |
| P-10 | Offener Saldo seit 30 Tagen | «Offen seit einem Monat: CHF 48.20 an Lena.» | v1 |
| P-11 | Nachkauf-Vorschlag | «Milch ist aufgebraucht. Auf die Liste oder bei [Partner] bestellen?» | Vision (Partner) |

**Technische Einschränkung, ehrlich:** Web Push für eine PWA braucht einen Server, der weiss, wann was abläuft (also ein Konto mit Sync). Auf dem iPhone funktioniert Web Push nur, wenn die App zum Home-Bildschirm hinzugefügt wurde. Ohne Konto zeigt die App den Digest beim Öffnen und ein Badge. Native Apps (Capacitor, v1) können Erinnerungen lokal auf dem Gerät planen, ganz ohne Server. Entscheid: Frage 11 im Plan.

## 1a. Erfassen der Zukunft (neu, Alban 6.11.2026)

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| S-01 | **Scan-Modus «Schnell»**: Barcode erkannt, sofort weiter | Einkauf in Sekunden erfassen | MVP (Schritt 10) |
| S-02 | **Scan-Modus «Gründlich»**: Packung langsam drehen, die App sucht über mehrere Bilder Barcode **und** Ablaufdatum (Rundum-Scan), Fortschritt «Barcode ✓ · Datum …» | Echtes Datum statt Schätzung | MVP (Logik 2i, Kamera Schritt 10) |
| S-03 | **Kühlschrank-Foto «wie Google Lens»**: Foto oder Schwenk, die App erkennt Lebensmittel, man bestätigt in einer Liste, Abgleich mit dem Vorrat | Erfassen und Kühlschrank-Check in einem | v1 (Server-KI nur mit Einwilligung) |
| S-04 | **Öffnungsregel**: «Grana Padano gültig bis März, nach dem Öffnen innert 3 Wochen» – mit «Geöffnet» gilt ab sofort das frühere Datum; die Regel kommt aus der Kategorie oder vom Etikett | Realistische Erinnerungen | MVP (Logik 2j, UI Schritt 6) |
| S-05 | **Teilweise verbraucht quittieren**: ¼ · ½ · ¾ · alles bei Gramm/ml, «1 von 4» bei Mehrfachpackungen | Vorrat bleibt genau | MVP (Schritt 6) |
| S-06 | **iOS-/Android-Widget** «Heute retten», **Kurzbefehle, Siri, Action-Button**, Haptik | Ohne App zu öffnen | v1 |

## 2a. Notvorrat: Langzeit-Lagerung (neu, Alban 6.11.2026)

Der Bund empfiehlt jedem Haushalt einen Notvorrat (Kampagne «Kluger Rat – Notvorrat» des BWL): Lebensmittel für rund eine Woche und 9 Liter Trinkwasser pro Person, **regelmässig aufbrauchen und ersetzen, um Abfall zu vermeiden**. Dazu kommen Prepper und Organisationen (Armee, Zivilschutz, Gemeinden, Firmen) mit Lebensmitteln, die 25 bis 50 Jahre halten.

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| N-01 | **Notvorrat als vierter Lagerort** mit eigenem Tab | Langzeit-Vorrat getrennt vom Alltag, kein Rauschen in «Heute retten» | MVP+ |
| N-02 | **Daten bis 50+ Jahre** erfassen: Schnellwahl «1 · 5 · 10 · 25 · 50 J», Tippen `12.2076`, 2D-Codes | Auch Militär- und Prepper-Nahrung | MVP+ (Logik fertig) |
| N-03 | **Rotation statt Wegwerfen:** Warnung 3 Monate vor Ablauf, «Zum Kochen brauchen und ersetzen», Ersatz mit 1 Tipp auf die Einkaufsliste | Genau das, was der Bund empfiehlt | MVP+ |
| N-04 | **Reichweite:** «Euer Notvorrat reicht für 9 Tage für 2 Personen» aus Kalorien (Nährwerte) und Wasser (9 l/Person) | Sinn der Nährwerte im Notfall | v1 |
| N-05 | Checkliste nach Empfehlung des Bundes (Wasser, Reis, Teigwaren, Öl, Salz …) mit Ampel | Vollständigkeit auf einen Blick | v1 |
| N-06 | Jahres-Check: einmal im Jahr alles durchgehen | Vorrat bleibt aktuell | v1 |
| N-07 | Organisationen (Zivilschutz, Gemeinden, Firmen, Armee) verwalten grosse Langzeit-Bestände | B2B, passt zu Option C | Vision |

## 2b. Abschliessen: essen, weitergeben, wegwerfen – und daraus lernen (Alban 6.11.2026)

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| A-01 | **Wegwerfen mit Grund**: abgelaufen, verdorben, zu viel gekauft, vergessen, schmeckt nicht | Ehrliche Statistik statt Schuldgefühl | MVP (Schritt 6) |
| A-02 | **Weitergeben mit Empfänger**: Haushalt, Nachbarschaft, Familie/Freunde, Spende, öffentlicher Kühlschrank | Zählt als «gerettet», zeigt Wirkung | MVP (Schritt 6) |
| A-03 | **Muster erkennen**: «Brot wird oft weggeworfen, weil zu viel gekauft» → Tipp «kleineres Brot» oder «halb einfrieren» | Prävention | v1 |
| A-04 | **Mengen wie im Alltag**: 250 g, 1.5 l, 3 dl, 2 Becher à 180 g, ½ Packung | Erfassen ohne Umrechnen | MVP (Schritt 3d) |

## 2c. Gemeinschaft: vom Haushalt zum Kollektiv (Vision, Alban 6.11.2026)

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| K-01 | Familie und WG einladen (Link/Code), gemeinsamer Vorrat | Basis des USP | MVP (Schritt 7) |
| K-02 | **Kreise** über den Haushalt hinaus: Haus, Strasse, Quartier – freiwillig, nur grober Ort | Nachbarschaft rettet gemeinsam | Vision |
| K-03 | **Kollektiv**: Frugalist:innen, Foodsharing-Gruppen, öffentliche Kühlschränke, Gemeinden teilen Überschüsse | Food Waste als Gemeinschaftsaufgabe | Vision |
| K-04 | Regeln für Kreise ausserhalb des Haushalts: nie nach dem Verbrauchsdatum, Hinweise zu Kühlkette und Allergenen, Melden/Sperren | Sicherheit und Vertrauen | Vision |
| K-05 | **Haus-Kreis** (Beispiel Albans Haus, 6 Wohnungen): Einladung per QR-Code im Treppenhaus; jede Wohnung zeigt freiwillig, was bald abläuft; Nachbar:innen fragen «Darf ich das haben?», die Besitzer:in sagt Ja oder Nein, Abholung «liegt vor der Tür von Wohnung 3» | Retten ohne Fremde, ohne Adresse | v1 (nach dem Rette-Kreis im Haushalt) |
| K-06 | **Suche-Wunsch** im Haus: «Hat jemand 2 Eier?» – klassisches Ausleihen unter Nachbarn | Weniger Einkäufe, mehr Gemeinschaft | v1 |
| K-07 | **Wirkung des Hauses**: «Unser Haus hat diesen Monat 12 kg gerettet» | Motivation, Grundlage für Gemeinde-Programme (Option C) | v1 |

### Ökosystem-Brainstorming (wenn es soweit kommt)

```
Person ─ Haushalt ─ Haus ─ Quartier ─ Gemeinde ─ Kollektiv/Organisationen
   │        │         │        │          │               │
 Vorrat  teilen,   anfragen, Angebote  Wirkungs-     Foodsharing,
 retten  Kosten    abholen   (grob,    berichte,     öffentliche
         teilen              PLZ)      Challenges    Kühlschränke,
                                                    Partner (Händler)
```

- **Gleiche Bausteine überall:** Angebot, Anfrage, Zusage, Abholung, Ergebnis («weitergegeben → gerettet»). Nur der Kreis wird grösser.
- **Vertrauen wächst mit der Nähe:** Im Haushalt alles sichtbar; im Haus nur Freigegebenes; im Quartier nur Angebote ohne Namen und mit grobem Ort.
- **Monetarisierung ohne Datenverkauf:** Gemeinden und Arbeitgeber bezahlen Programme mit aggregierter Wirkung; Händler bezahlen für Nachkauf-Vorschläge und Quittungs-Sync mit Einwilligung; Pro-Abo für Haushalte.

## 2d. Büro-Kühlschrank: beschriften statt anschreiben (Idee Alban, 6.11.2026)

**Problem:** Im Büro-Kühlschrank weiss niemand, wem was gehört. Man schreibt Namen auf Becher, Sachen werden vergessen, jemand wird krank oder geht in die Ferien, und am Putztag fliegt alles raus, oft ohne Rückfrage. Das ist schlecht für Hygiene, Stimmung und Food Waste.

**Idee:** Der Büro-Kühlschrank wird ein eigener **Kreis** wie ein Haushalt. Wer etwas hineinlegt, erfasst es kurz in der App und ist sichtbar die Besitzer:in. Die App erinnert, fragt nach und regelt das Entsorgen fair.

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| B-01 | **Büro-Kreis beitreten** per QR-Code an der Kühlschranktür; mehrere Kühlschränke pro Firma möglich | Kein Setup, alle sind drin | Vision |
| B-02 | **Digital beschriften**: beim Hineinlegen Name + Besitzer:in (automatisch du) + Datum; ohne Foto, ohne Filzstift | Alle sehen, wem was gehört | Vision |
| B-03 | **Etikett verknüpfen** (optional): nummerierte QR-Sticker auf der Rolle; Sticker scannen verbindet Becher und Eintrag | Auch im Kühlschrank eindeutig | Vision |
| B-04 | **«Wem gehört das?»**: Sticker scannen oder in der Liste suchen → Besitzer:in, seit wann, bis wann haltbar; kurze Nachricht in der App («Dein Joghurt läuft heute ab») | Kein Rundmail, kein Zettel | Vision |
| B-05 | **Erinnern und Freigeben**: vor Ablauf Push an die Besitzer:in mit drei Antworten: «Hole ich», «Darf weg», «Darf jemand essen» | Weniger Waste, klare Ansage | Vision |
| B-06 | **Abwesend**: «Bin bis Montag weg: meine Sachen dürfen geteilt / entsorgt werden»; ohne Antwort gilt nach einer Frist die Büro-Regel | Kranke und Ferien sind kein Problem mehr | Vision |
| B-07 | **Putztag und Hygiene**: fester Termin (z. B. Freitag 15 Uhr), vorher Push an alle mit Sachen, die raus müssen; danach Protokoll «entsorgt von, warum»; Kühlschrank-Ämtli im Wechsel | Sauberer Kühlschrank, nachvollziehbar und fair | Vision |
| B-08 | **Geteiltes fürs Team**: Milch, Kaffeerahm, Butter als «gehört allen»; «Milch fast leer» → Einkaufsliste der Office-Verantwortlichen; Kosten aus Teamkasse oder aufgeteilt | Kein «Wer hat die Milch leer gemacht?» | Vision |
| B-09 | **Wirkung fürs Team**: «Euer Büro hat diesen Monat 4 kg gerettet» (anonym, nur Summen); passt zu Nachhaltigkeitsberichten | Motivation, Argument für die Firma | Vision |

**Was die Architektur schon kann:**
- Haushalt = Kreis mit Mitgliedern; **`owner` pro Artikel** gibt es bereits (Person oder «geteilt»).
- Entsorgen mit **Grund** und **wer** steht in jedem Abschluss (`wasteReason`, `by`, Schritt 6).
- Benachrichtigungen, Rechte (`Grant`) und Einwilligungen sind vorgesehen.
- Später neu: Kreis-Art (`home` | `office`), Regeln pro Kreis (Putztag, Frist), Rolle «Kühlschrank-Verantwortliche:r», optionaler `labelCode` am Artikel.

**Leitplanken (wichtig im Arbeitsumfeld):**
- Keine Überwachung: Die App zeigt Besitz und Entsorgung, aber nicht, wer was isst oder wann jemand am Kühlschrank war.
- Die Firma sieht nur Summen (kg, CHF, Anzahl Putzaktionen), nie Personen oder Einzeldaten.
- Kein Prangern: Erinnerungen gehen nur an die Besitzer:in, nicht an alle.
- Keine Fotos als Standard (Fotos könnten Personen oder Büros zeigen).

**Monetarisierung (nur Ideen, Entscheid später):**

| Modell | Gratis | Bezahlt |
| --- | --- | --- |
| A) Team-Stufe | ein Kühlschrank, bis ca. 10 Personen, Beschriften, «Wem gehört das?», Erinnerungen | mehr Personen und Kühlschränke |
| B) Pro für Büros (pro Person/Monat) | wie A | Putztag-Regeln und Protokolle, Abwesenheits-Regel, Rollen, Berichte, mehrere Standorte, später SSO |
| C) Lizenz für Facility Management, Coworking-Spaces, Kantinen-Betreiber | – | Pauschale pro Standort, Sticker-Rollen als Zubehör |
| D) Büro als Einstieg (B2B2C) | Büro-Grundfunktionen gratis | Kolleg:innen lernen Rettich kennen und nutzen es zu Hause; Umsatz über Haushalts-Pro |

**Phase:** nach dem Teilen im Haushalt (Schritt 7, Konto und Sync), frühestens v1. Bis dahin sorgt das Datenmodell dafür, dass nichts umgebaut werden muss.

## 3. Kochen & Verwerten: Rezepte

> **Stand 11.11.2026:** Der Tab «Kochen» ist entfernt ([ADR-0040](adr/0040-no-recipes.md)); die kuratierten Rezepte, «Heute kochen» und «Alle Rezepte» sind unter «Wissen» zurück ([ADR-0048](adr/0048-recipes-return-under-wissen.md)). Abbuchen nach dem Kochen (R-03), eigene Rezepte und die Visionen bleiben spätere Möglichkeiten.

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| R-01 | 3 «Rette-es»-Vorschläge aus bald ablaufenden Artikeln | Waste wird zu Znacht | MVP |
| R-02 | Fehlende Zutaten mit 1 Tipp auf die Einkaufsliste | Weniger Aufwand | MVP |
| R-03 | **Nach dem Kochen abbuchen**: verwendete Zutaten mit 1 Tipp als «gegessen» markieren | Vorrat bleibt korrekt, Zähler steigt | MVP+ |
| R-04 | **Reste-Tipps pro Kategorie** (Brot → Fotzelschnitten, Bananen → Bananenbrot) und Lagertipps («Schauen, Riechen, Probieren» nur beim MHD) | Wissen statt Wegwerfen | MVP+ (Teil des Kategorien-Katalogs) |
| R-05 | Filter vegetarisch, vegan, Allergene (Allergiker:innen waren in ATL1 eine Zielgruppe) | Passende Vorschläge | v1 |
| R-06 | Wochenplan aus dem Vorrat | Planung für Familien | v1 |
| R-07 | KI-Rezept aus beliebigem Vorrat (LLM, Opt-in) | Unendliche Vielfalt | v1 / Vision |
| R-08 | Partner-Rezepte (z. B. Rezeptplattformen von Händlern) über `RecipeProvider` | Inhalt plus Partner-Einnahme | Vision |

## 4. Einkaufen

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| E-01 | Geteilte Einkaufsliste | Basis | MVP |
| E-02 | **Doppelkauf-Warnung** beim Hinzufügen: «Ihr habt noch 2 Milch (bis Freitag).» | Waste wird gar nicht erst gekauft | MVP+ |
| E-03 | Vorschläge aus dem Verlauf (was regelmässig gekauft wird) | Weniger Tippen | v1 |
| E-04 | **Packungsgrössen-Tipp** aus Waste-Daten: «Ihr werft oft halben Salat weg. Lieber den kleinen?» | Prävention statt Rettung | v1 |
| E-05 | Einkaufsliste → Warenkorb bei einem Lieferdienst | Bequemlichkeit, Provision | Vision (`DeliveryProvider`) |
| E-06 | «Setz Eier auf die Liste» per KI- oder Sprachassistent | Erfassen ohne App öffnen | v1 (MCP) |

## 5. Zusammenleben: der USP für WGs, Paare, Familien

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| W-01 | Besitz pro Artikel («gehört Lena» / «gehört allen»), Filter Meins/Geteilt/Alle | «Der Joghurt gehört Person 1» (Idee aus ATL1) | MVP |
| W-02 | Kostenteilung aus der Quittung, Saldo pro Person, «Ausgleich erfasst» | Kein Tricount nötig | MVP |
| W-03 | Rette-Kreis: freigeben, übernehmen | Retten im Haushalt | MVP |
| W-04 | **Grundvorrat automatisch geteilt** (Öl, Salz, WC-Papier per Kategorie standardmässig «geteilt») | Weniger Zuordnen bei der Quittung | MVP+ |
| W-05 | Ein- und Auszug: Saldo abschliessen, Artikel übergeben | WGs wechseln oft | MVP |
| W-06 | **«Darf ich?»-Anfrage**: Mitbewohner:in fragt, ob sie Lenas Rahm nehmen darf; bei Ja wird automatisch verrechnet | Fairness ohne Zettel am Kühlschrank | v1 |
| W-07 | Monatsabrechnung zum Teilen (Bild/PDF) | Transparenz in der WG | v1 |
| W-08 | Kinderprofile ohne eigenes Konto | Familien | v1 |

## 6. Wirkung & Motivation: Dashboards

| # | Use Case | Nutzen | Phase |
| --- | --- | --- | --- |
| D-01 | **Haushalts-Dashboard**: gerettet vs. weggeworfen in CHF und kg, Woche/Monat, Trend | Sichtbare Ersparnis (Blue Ocean: «Steigern») | MVP |
| D-02 | Pro Person (in der WG, Sichtbarkeit wählbar) | Motivation | MVP |
| D-03 | Vergleich mit dem Schweizer Durchschnitt (rund 80 kg / CHF 600 pro Person und Jahr) | Einordnung | MVP+ (statischer Benchmark mit Quelle) |
| D-04 | Top-Waste-Kategorien und Muster («Brot landet oft am Montag im Abfall») | Verhalten ändern | v1 |
| D-05 | Haushalts-Challenge «4 Wochen weniger Waste» mit Fortschritt | Gamification mit echter Wirkung | v1 |
| D-06 | CO₂-Äquivalent | Klimabezug | v1 (nur mit belastbaren Faktoren) |
| D-07 | Ausgaben pro Monat und Händler aus den Quittungen | Budget | v1 (Nebenprodukt, kein Fokus: das ist Rappns Terrain) |
| D-08 | **Gemeinde-/Arbeitgeber-Dashboard**: anonymisierte, aggregierte Wirkung einer Challenge | Erster zahlender Kunde (Option C) | v1 / B2B |

## 7. Partner & Plattform: Monetarisierung über API und MCP

Damit diese Fälle später ohne Umbau möglich sind, baut der MVP eine saubere **Schnittstelle** (Commands, Queries, Events) mit Einwilligungsmodell. Details: [`plan.md`](./plan.md), Abschnitt 2.

| Partner | Use Case | Was Rettich liefert | Erlösmodell | Phase |
| --- | --- | --- | --- | --- |
| **Gemeinden, Kantone, Arbeitgeber, Versicherer** | Food-Waste-Programm, 4-Wochen-Challenge | Aggregierte, anonymisierte Wirkung (kg, CHF) | Lizenz pro Programm (laut Analyse der realistischste Umsatz) | v1 |
| **KI-Assistenten** (Claude, ChatGPT u. a.) via MCP | «Was muss ich heute essen?», «Was koche ich?», «Setz Milch auf die Liste» | MCP-Tools mit Haushalts-Einwilligung | Pro-Feature, Reichweite | v1 |
| **Detailhändler** (Migros, Coop) | Quittungs-Sync statt Upload, Vorratsmodul in der Händler-App (Option B) | Vorrats- und Waste-Engine als White-Label | Lizenz | Vision (kein öffentlicher API-Zugang heute) |
| **Lieferdienste, Online-Shops** | Einkaufsliste → Warenkorb, Nachkauf bei «aufgebraucht» | Event `item.used_up` und Einkaufsliste | Provision | Vision |
| **Rezeptplattformen** | Rezepte zu bald ablaufenden Zutaten | Anfrage «diese Zutaten laufen ab» | Lizenz oder gekennzeichnetes Sponsoring | Vision |
| **Foodsharing-Initiativen** (z. B. öffentliche Kühlschränke, Too Good To Go) | Rette-Kreis in die Nachbarschaft öffnen | Freigegebene Artikel mit Ort (nur mit Opt-in) | Kooperation, Impact | Vision |
| **Ernährungs-Apps** (Ursprungsidee aus ATL1: YAZIO) | Nährwerte zum Vorrat | Export des Vorrats | Kooperation | Vision |
| **Smart Home & Hardware** (Alexa, Google Home, HomeKit aus ATL1; eigenes Modul aus ATL2) | Sprachabfrage, automatische Erfassung | Dieselbe API: Das Modul ist einfach ein weiterer Client | Hardware + Abo | Vision |

**Rote Linie für alle Partner:** Zugriff nur mit ausdrücklicher Einwilligung des Haushalts, mit klaren Rechten (z. B. nur «Einkaufsliste schreiben»), jederzeit widerrufbar und protokolliert. Kein Verkauf von Einzeldaten.

## 8. Bewusst nicht im MVP

Kalorien und Nährwerte, Prospekte und Angebote, grosse Rezeptdatenbank, eigene Hardware, echte Partner-Anbindungen, Standortdaten, Werbung. (ERRC-Raster der Blue-Ocean-Analyse)

## 9. Was das für den Plan heisst

Die **MVP+**-Vorschläge sind alle klein und in [`plan.md`](./plan.md) den Schritten zugeordnet:

| Vorschlag | Schritt |
| --- | --- |
| UC-01 Startseite «Heute retten», UC-03 Wert im Kühlschrank, UC-07 Standardartikel | 3 |
| UC-04 Kühlschrank-Check, D-03 CH-Benchmark | 6 |
| N-01 Notvorrat-Tab, N-02 Langzeit-Daten | 3 (Logik: 2h) |
| N-03 Rotation 3 Monate vorher | 8 |
| P-01 Digest, P-02 Verbrauchsdatum, P-03 Einfrier-Tipp, P-06 Wochenrückblick | 8 |
| W-04 Grundvorrat geteilt | 9 |
| R-03 Nach dem Kochen abbuchen, R-04 Reste-Tipps, E-02 Doppelkauf-Warnung | 11 (R-04-Daten in 2) |
