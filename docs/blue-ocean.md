# Rettich – Strategie in Kürze

> Zusammenfassung der Blue-Ocean-Analyse (Stand 6.11.2026) und der Schularbeiten ATL1 (Okt. 2025) und Businessplan ATL2 (März 2026). Die Originale liegen nicht im Repo.
>
> **Nachtrag 9.11.2026:** Seit dem 8.11.2026 gibt es keine Rezepte mehr ([ADR-0040](adr/0040-no-recipes.md)). Rettich zeigt, was du verwertest und was du entsorgst und was es kostet; es zählt keine Kalorien ([ADR-0046](adr/0046-awareness-verwertet-entsorgt.md)). Was heute gebaut ist, steht im [Plan](./plan.md#stand-nach-200-prs).

## Herkunft der Idee

- **ATL1 (Okt. 2025):** Inspiriert von YAZIO. Vision: smarter Kühlschrank bzw. Nachrüstmodul mit Barcode-Scanner, Ablauf-Erinnerungen, Rezepten, Profilen pro Person («Der Joghurt gehört Person 1»), Nährwerten über YAZIO, später RFID/NFC, Bestellung bei Partnern (Migros, Coop, Galaxus) und Smart-Home-Anbindung (Alexa, Google Home, HomeKit).
- **ATL2, Businessplan (März 2026, 4-köpfiges Team):** Freemium-App, danach optionales Hardware-Modul (ca. CHF 400). Abo «AI+/Health» CHF 9/Monat. Umsatz aus Hardware, Abos, Premium-Modulen, B2B-Lizenzen/White-Label, Provisionen und «datenbasierten Insights (anonymisiert)». Differenzierung über Datenschutz und lokale Verarbeitung. Markteintritt DACH.

## Was die Blue-Ocean-Analyse daraus macht

**Kernaussage:** Die Basis (Vorrat in 3 Orten, Ablaufdaten, Rezepte, Quittungs-Scan, Haushalt teilen) ist Red Ocean, auch in der Schweiz (ZWIMP, Kühlbär). Rettich gewinnt nicht mit mehr Funktionen, sondern mit einer anderen Nutzenkurve.

**Problem in Zahlen:** 720'000 t vermeidbare Verluste in Haushalten pro Jahr, 35 % Anteil der Haushalte an der Umweltbelastung (BAFU); rund 80 kg und CHF 600 pro Person und Jahr (Kanton Zürich, 2026). 71 % der 18- bis 24-Jährigen prüfen nicht, ob ein Produkt noch gut ist (Too Good To Go, 2024).

**Wichtigste Konkurrenz in der Schweiz:**

| App | Stärke | Preis |
| --- | --- | --- |
| ZWIMP | Migros-CSV-, Coop-PDF- und Foto-Import | gratis 3 Importe/Monat, Pro CHF 4.90/Monat |
| Kühlbär | Spar-Zähler in CHF, WG-Sharing gratis, nur iOS | gratis bis 35 Artikel, CHF 3/Monat |
| Bring! | Einkaufsliste, 21 Mio. Nutzer, Werbeplattform | gratis |

**Offen (Blue Ocean):** Niemand verknüpft den Vorrat mit «wem gehört das und wer hat bezahlt», und niemand macht aus Haushalts-Food-Waste ein messbares Programm für einen zahlenden Dritten.

### ERRC-Raster

| Eliminieren | Reduzieren | Steigern | Kreieren |
| --- | --- | --- | --- |
| Hardware im MVP, Kalorien/Nährwerte, Prospekte, grosse Rezeptdatenbank | Manuelles Erfassen, Einstellungen, Rezepte (3 «Rette-es»-Vorschläge), Lagerorte fix | Automatik (Quittung, Einkaufsliste → Vorrat), Zusammenarbeit, Ersparnis in CHF, Vertrauen (Schweizer Hosting, lokal), MHD-Wissen | Besitz pro Artikel, Kostenteilung aus der Quittung, Rette-Kreis, Challenges mit gemessener Wirkung, White-Label für Händler und Gemeinden |

### Drei Optionen

- **A · WG-Kühlschrank (Empfehlung für den Start):** Besitz pro Person, Kostenteilung aus der Quittung, Rette-Kreis. Viral (jede WG lädt 2–4 Personen ein), billig zu testen. Contra: geringe Zahlungsbereitschaft, Splitwise/Tricount existieren, Churn bei WG-Auflösung.
- **B · Zero-Input über Händler (B2B2C):** Vorrat füllt sich aus Migros-/Coop-Konten. Contra: kein öffentlicher Zugang («We do not have a public API», Migros), lange Verkaufszyklen.
- **C · Programm für Gemeinden und Arbeitgeber:** 4-Wochen-Challenge mit anonymisierter Wirkung. Klarer Käufer mit Ziel 2030, laut Analyse der realistischste Umsatz. Braucht zuerst eine funktionierende App (Option A).

### Monetarisierung (Empfehlung der Analyse)

Gratis-Kern ab Tag 1 → Haushalts-Abo ab ca. 500 aktiven Haushalten (CHF 9 ist über dem Markt) → Programm-Lizenz nach erstem Wirkungsnachweis → Nachkauf-Provision nur mit Direktdeal → Werbung erst bei sechsstelliger Nutzerzahl.

### Grösste Risiken

1. **Erfassungsmüdigkeit** (Vorrats-Apps sterben, wenn das Eintragen nervt)
2. Kopierbarkeit: ZWIMP oder Kühlbär könnten Kostenteilung schnell nachbauen
3. Händler schlucken die Funktion (Beispiel Mealime, Okt. 2026)
4. Datenschutz: Quittungen zeigen Konsumverhalten
5. Businessplan (Hardware, 20 Mitarbeitende, CHF 582'000 Verlust im ersten Jahr) ist für die App-Phase zu gross gedacht

### Empfohlene nächste Schritte (nicht Code)

Konkurrenz selbst testen → 10–15 Interviews → Landingpage-Test mit zwei Botschaften → Concierge-MVP (3 WGs, 2 Wochen) → Klickdummy und 5 Usability-Tests → Pilot-Gespräch (z. B. Gemeinde Volketswil, Fachstelle Food Waste Kanton Zürich) → Entscheid nach 6 Wochen.

## Spannungen, die wir klären müssen

| Thema | Businessplan/ATL | Brief/Analyse | Stand |
| --- | --- | --- | --- |
| Hardware | Kern des Geschäftsmodells | Vision, nicht MVP | Plan folgt Analyse |
| Kalorien/Gesundheit | Zentrales Nutzenversprechen | Eliminiert | **Entscheid Alban (6.11.2026):** Nährwerte, Kalorien und Allergene werden beim Scan übernommen und angezeigt; kein Kalorien-Tagebuch (ADR-0006) |
| Preis | CHF 9/Monat | über dem Markt | offen (Plan, Frage 5) |
| «Datenbasierte Insights» als Umsatz | ja | «kein Verkauf von Daten» | offen (Plan, Frage 13) |
