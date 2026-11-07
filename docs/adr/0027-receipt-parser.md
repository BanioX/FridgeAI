# ADR-0027: Bon lesen – Preise aus dem Kassenzettel

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): Preise sollen mit dem Bon oder mit Referenzpreisen von Coop, Migros, Aldi, Lidl und Denner abgeglichen werden, mit Datum. Die Preislogik soll höchste Qualität haben.

Die Händler bieten keine offene Preis-Schnittstelle. Ihre Websites automatisch auszulesen verbieten die Nutzungsbedingungen, und CLAUDE.md schliesst echte Händler-Anbindungen aus. Der Bon dagegen zeigt den echten bezahlten Preis mit Aktion, Datum und Laden. Er gehört der Person, die eingekauft hat.

## Entscheid

- **Der Bon ist die Preisquelle.** Schritt 4 des Plans beginnt mit einem allgemeinen Leser in `packages/core` (`parseReceiptText`). Er ist reines TypeScript und arbeitet auf OCR-Text.
- **Was er erkennt:**
  - Händler: Coop, Migros, Aldi, Lidl, Denner, sonst «andere». `RetailerSchema` ist dafür erweitert.
  - Laden, Datum und Uhrzeit.
  - Artikel mit Menge und Stückpreis («2x 4.20»), Gewichtsartikel («0.734 kg x 2.90»), MWST-Codes am Zeilenende.
- **Rabatte und Nebenposten:**
  - Rabatte direkt unter einem Artikel gehören zu diesem Artikel.
  - Rabatte nach der Zwischensumme oder auf den ganzen Einkauf («Einkaufsrabatt») bleiben eigene Zeilen.
  - Pfand und Tragtaschen sind eigene Arten.
- **Summenprüfung:** Die Zeilen müssen auf den Rappen das gedruckte Total ergeben. Sonst meldet der Leser `mismatch`, und die Review zeigt es an. Ein falsch gelesener Betrag fällt so auf, statt still gespeichert zu werden.
- **Lesefehler und Testbons:** OCR-Verwechslungen werden nur in Beträgen korrigiert (`l.95` → `1.95`; «1.5l» bleibt ein Liter). Testbons sind erfunden; echte Bons kommen nie ins Repo.
- **Danach:** Händler-Leser für Coop und Migros mit echten Beispielen, OCR auf dem Gerät (Schritt 5), Review, Preisgedächtnis pro Produkt.

## Konsequenzen

- Preise kommen mit Datum und Laden aus dem echten Einkauf, ohne Konto, Schlüssel oder Server. Die Genauigkeit für Coop und Migros hängt von echten Beispielen ab (Frage 7 im Plan).
- Referenzpreise anderer Läden bleiben eine Option über Open Prices, nur mit Albans OK, weil dabei der Barcode das Gerät verlässt.
