# FridgeAI – Use Cases (Brainstorming)

> **Status:** Brainstorming zur Diskussion, Stand 6. November 2026.
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
| UC-05 | Bon-Foto, Migros-CSV, Coop-PDF | Erfassen ohne Tippen | MVP |
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
| P-05 | Kostenteilung: neuer Bon im Haushalt | «Marco hat einen Coop-Bon erfasst. Dein Anteil: CHF 12.40.» | MVP |
| P-06 | Wochenrückblick (Sonntagabend) | «Diese Woche gerettet: CHF 23.50 / 1.4 kg. Weggeworfen: 1 Salat.» | MVP+ |
| P-07 | Lange im Tiefkühler | «Seit 5 Monaten im Tiefkühler: Erbsen.» | v1 |
| P-08 | Einkaufsliste geändert (Opt-in) | «Sara hat 3 Artikel auf die Liste gesetzt.» | v1 |
| P-09 | Bon-Erinnerung nach typischem Einkaufsmuster (keine Standortdaten) | «Warst du heute einkaufen? Bon scannen dauert 20 Sekunden.» | v1 |
| P-10 | Offener Saldo seit 30 Tagen | «Offen seit einem Monat: CHF 48.20 an Lena.» | v1 |
| P-11 | Nachkauf-Vorschlag | «Milch ist aufgebraucht. Auf die Liste oder bei [Partner] bestellen?» | Vision (Partner) |

**Technische Einschränkung, ehrlich:** Web Push für eine PWA braucht einen Server, der weiss, wann was abläuft (also ein Konto mit Sync). Auf dem iPhone funktioniert Web Push nur, wenn die App zum Home-Bildschirm hinzugefügt wurde. Ohne Konto zeigt die App den Digest beim Öffnen und ein Badge. Native Apps (Capacitor, v1) können Erinnerungen lokal auf dem Gerät planen, ganz ohne Server. Entscheid: Frage 11 im Plan.

## 3. Kochen & Verwerten: Rezepte

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
| W-02 | Kostenteilung aus dem Bon, Saldo pro Person, «Ausgleich erfasst» | Kein Tricount nötig | MVP |
| W-03 | Rette-Kreis: freigeben, übernehmen | Retten im Haushalt | MVP |
| W-04 | **Grundvorrat automatisch geteilt** (Öl, Salz, WC-Papier per Kategorie standardmässig «geteilt») | Weniger Zuordnen beim Bon | MVP+ |
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
| D-07 | Ausgaben pro Monat und Händler aus den Bons | Budget | v1 (Nebenprodukt, kein Fokus: das ist Rappns Terrain) |
| D-08 | **Gemeinde-/Arbeitgeber-Dashboard**: anonymisierte, aggregierte Wirkung einer Challenge | Erster zahlender Kunde (Option C) | v1 / B2B |

## 7. Partner & Plattform: Monetarisierung über API und MCP

Damit diese Fälle später ohne Umbau möglich sind, baut der MVP einen sauberen **Vertrag** (Commands, Queries, Events) mit Einwilligungsmodell. Details: [`plan.md`](./plan.md), Abschnitt 2.

| Partner | Use Case | Was FridgeAI liefert | Erlösmodell | Phase |
| --- | --- | --- | --- | --- |
| **Gemeinden, Kantone, Arbeitgeber, Versicherer** | Food-Waste-Programm, 4-Wochen-Challenge | Aggregierte, anonymisierte Wirkung (kg, CHF) | Lizenz pro Programm (laut Analyse der realistischste Umsatz) | v1 |
| **KI-Assistenten** (Claude, ChatGPT u. a.) via MCP | «Was muss ich heute essen?», «Was koche ich?», «Setz Milch auf die Liste» | MCP-Tools mit Haushalts-Einwilligung | Pro-Feature, Reichweite | v1 |
| **Detailhändler** (Migros, Coop) | Bon-Sync statt Upload, Vorratsmodul in der Händler-App (Option B) | Vorrats- und Waste-Engine als White-Label | Lizenz | Vision (kein öffentlicher API-Zugang heute) |
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
| P-01 Digest, P-02 Verbrauchsdatum, P-03 Einfrier-Tipp, P-06 Wochenrückblick | 8 |
| W-04 Grundvorrat geteilt | 9 |
| R-03 Nach dem Kochen abbuchen, R-04 Reste-Tipps, E-02 Doppelkauf-Warnung | 11 (R-04-Daten in 2) |
