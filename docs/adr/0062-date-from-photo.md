# ADR-0062: Datum fotografieren

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude (Umsetzung von M7)

## Kontext

Das Ablaufdatum einzutippen ist die grösste Hürde beim Erfassen (`docs/ideen/mitbewerber-apps.md`, M7). Die Texterkennung auf dem Gerät gibt es schon (ADR-0028, tesseract.js, selbst gehostet).

## Entscheid

1. **Nur auf dem Gerät.** Der Knopf «Datum fotografieren» unter «Haltbar bis» öffnet erst nach dem Tipp die Kamera (oder die Galerie) und liest das Foto mit `readImageText` im Modus «spärlicher Text». Das Bild wird nicht gespeichert und verlässt das Gerät nie. Keine neue Abhängigkeit, kein neuer Datenfluss.
2. **Auswertung im Kern** (`parseExpiryFromText`, reines TypeScript): Formate `TT.MM.JJJJ`, `TT.MM.JJ` mit `.`, `/`, `-`, Monat und Jahr allein (letzter Tag des Monats), typische Lesefehler (O, l, I, S, B) nur innerhalb von Zifferngruppen. Gültig ist nur ein echtes Datum zwischen heute minus 30 Tage und heute plus 10 Jahre.
3. **Regel zur Wahl, aus Sicherheit:** Ein Datum bei einem Stichwort («Mindestens haltbar bis», «Zu verbrauchen bis», französisch und italienisch, MHD, EXP) gewinnt und nennt die Datumsart. Sonst gilt das früheste Datum ab heute, lieber zu früh als zu spät. Vergangene Daten sind Herstellungsdaten, Chargencodes und Preise zählen nicht. Volle Daten gehen vor «MM.JJ», weil ein Preis wie 11.27 sonst täuscht.
4. **Der Mensch prüft:** Das Feld wird gefüllt, die Zeile sagt «Gelesen: …. Stimmt das?». Gespeichert wird die Quelle `label_ocr` (ADR-0006), solange das Datum so bleibt.

## Folgen

- Gebogene oder geprägte Daten (Dosenboden, Flaschenhals) liest die Erkennung schlecht; Eintippen bleibt der Rückweg, und bei Misserfolg sagt die App das ehrlich.
- Das Modell wird beim ersten Lesen geladen; ohne Netz und ohne bisherigen Abruf meldet die App, dass das Lesen nicht geklappt hat.

## Nachtrag (12.11.2026): auch beim Ändern und beim Einräumen

Der Knopf steht nun überall, wo man das Datum setzt (`docs/flaechen.md`, K8).

- **Ändern:** Unter «Haltbar bis» der Artikelseite steht derselbe Knopf mit denselben Texten. Gespeichert wird `label_ocr` (und die Datumsart), solange das Datum so bleibt, wie es gelesen wurde; wer es danach überschreibt, speichert `manual`.
- **Einräumen:** Jede Zeile, deren Datum nur geschätzt ist, hat daneben eine kleine Kamera-Aktion («Datum fotografieren für Milch»). Sie liest das Datum und speichert es sofort; die Zeile zeigt es, und die eine Statuszeile der Seite bestätigt es. Die Aktion ist ein eigenes Bedienelement neben dem Link zum Artikel.
- **Schnittstelle (additiv):** `inventory.updateItem` nimmt ein optionales `expirySource`, begrenzt auf das, was eine Person auslösen kann: `manual` (Standard) und `label_ocr`. Es wirkt nur, wenn sich das Datum ändert.
