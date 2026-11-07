# rettich vor Kopien schützen

Stand: 7.11.2026, Recherche mit Quellen. **Keine Rechtsberatung.** Vor einer Anmeldung kurz mit einer Markenanwältin oder einem Markenanwalt sprechen (unten).

## Das Wichtigste in drei Sätzen

1. **Ideen und Funktionen lassen sich nicht schützen**, nur Name, Logo und Code. Ein Nachbau der Funktionen ist erlaubt (URG Art. 21, URV Art. 17), Software-Patente sind für rettich unrealistisch (EPÜ Art. 52).
2. **Der Name ist das Wertvollste:** Die Marke «rettich» vor dem öffentlichen Start anmelden.
3. **Der echte Schutz ist Tempo:** Abdeckung der Schweizer Bons, Vertrauen dank Datenschutz, Haushalte, die zusammen einladen, und schnelle Weiterentwicklung.

## Was schon erledigt ist

| Massnahme | Stand |
| --- | --- |
| Repository privat | ja (geprüft 7.11.2026) |
| Lizenz proprietär, alle Rechte bei Alban | ja (`LICENSE`) |
| Keine Source Maps in der ausgelieferten App | ja. Der Build enthält keine `.map`-Dateien (geprüft 7.11.2026). Nur der fertige Worker von tesseract.js verweist auf eine, die nicht ausgeliefert wird |
| Urheberschaft belegbar | ja, über die Git-Historie mit Datum. Code ist ab Entstehung geschützt, ohne Registrierung (URG Art. 2 und 29) |

## Was Alban tun kann (kostet Geld, darum Albans Entscheid)

| Schritt | Kosten | Wann |
| --- | --- | --- |
| **Marke Schweiz** (IGE, online), Klassen 9 (App), 42 (Software als Dienst) und eine dritte, z. B. 43 (Rezeptinformation) | **CHF 350** für bis zu 3 Klassen, 10 Jahre ([IGE](https://ige.ch/en/protecting-your-ip/trade-marks/national-applications/costs-and-fees)) | vor App Store und Marketing |
| **EU-Marke** (EUIPO), innert 6 Monaten mit Schweizer Priorität | **EUR 900** für 2 Klassen, EUR 1050 für 3 | vor dem Start in Deutschland und Österreich |
| Logo als **Wort-/Bildmarke** mitanmelden (sinnvoller als Designschutz) | in der Markenanmeldung enthalten. Designschutz allein: CHF 200 | mit der Marke |
| **NDA** (Geheimhaltungsvereinbarung) mit Pilot-Tester:innen | gratis (Vorlage) | vor dem ersten Test ausserhalb der Familie |
| **Nutzungsbedingungen** mit Verbot des Reverse Engineering (soweit gesetzlich erlaubt) | gratis | vor dem öffentlichen Start |
| Optional: Markenrecherche durch Anwält:innen | Offerte einholen | vor der EU-Marke |

**Selbst prüfen, ob der Name frei ist (gratis):** [swissreg](https://www.swissreg.ch), [TMview](https://www.tmdn.org/tmview), [EUIPO eSearch](https://euipo.europa.eu/eSearch). Das IGE macht seit 2022 keine eigenen Recherchen mehr.

## Befund zum Namen

- Eine eingetragene Marke «Rettich» oder «rett ich» hat die Websuche nicht gefunden. Die Register konnten nicht direkt abgefragt werden, das muss Alban selbst prüfen.
- **Achtung:** In Saarbrücken gibt es den **«Rettermarkt Rettich»**, einen Laden, der Lebensmittel rettet. Gleiches Thema, gleicher Name: für eine EU-Marke und den deutschen Markt vorher anwaltlich prüfen lassen.
- «Rettich» ist ein Lebensmittelwort. In den Klassen 9 und 42 ist das kaum ein Problem, in 43/44 könnte das Amt einwenden, der Name beschreibe nur. Die Schreibweise «rettich» mit dem Wortspiel «rett' ich» und das Logo helfen.

## Spannungsfeld local-first

Weil rettich Bons auf dem Gerät liest, läuft die Logik im Browser und ist dort einsehbar (verkleinert, aber nicht geheim). Server-Logik würde besser schützen, widerspricht aber dem Versprechen «deine Daten bleiben auf dem Gerät». **Empfehlung:** local-first bleiben. Nachladbare Daten wie Parser-Regeln und Produktkatalog können später vom Server kommen, ohne dass Nutzerdaten das Gerät verlassen.

## Beratung in der Schweiz

- **Innosuisse Start-up Coaching** (Initial Coaching für junge Firmen)
- kantonale Wirtschaftsförderung und Gründerzentren
- Markenanwält:innen über die Verbände ([IGE-Liste](https://www.ige.ch/en/protecting-your-ip/patents/before-you-apply/patent-attorneys/patent-attorney-associations-in-ch-and-fl?L=3))
