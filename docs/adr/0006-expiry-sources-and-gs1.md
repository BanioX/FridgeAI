# ADR-0006: Ablaufdatum – Quellen, Datumsart und GS1-2D-Codes

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): Der Scan soll Produkt, Nährwerte, Kalorien und, wo vorhanden, das Ablaufdatum automatisch übernehmen. Wo es das noch nicht gibt, soll FridgeAI vorausschauend bereit sein und bis dahin eine manuelle Eingabe bieten (Kalender oder `dd.mm.yyyy`).

Heute tragen klassische Strichcodes (EAN-13/EAN-8/UPC) **nur die Artikelnummer (GTIN)**, kein Datum. Der Handel stellt auf **GS1-2D-Codes** um (GS1 DataMatrix, QR mit GS1 Digital Link; Initiative «GS1 Sunrise 2027»). Diese können Ablaufdatum (AI 17), Mindesthaltbarkeit (AI 15), Charge (AI 10) und Gewicht (AI 310n) enthalten.

## Entscheid

1. **Jeder Artikel speichert, woher sein Datum stammt** (`expirySource`): `category_estimate`, `manual`, `gs1_code`, `label_ocr`, `partner`. Nur `category_estimate` gilt in der UI als «geschätzt».
2. **Jeder Artikel speichert die Datumsart** (`expiryKind`: MHD oder Verbrauchsdatum). Standard ist die Kategorie; ein GS1-Code (AI 15 vs. 17) oder ein Etikett überschreibt sie.
3. **`parseScannedCode`** in `core` versteht EAN/UPC/GTIN, GS1-Element-Strings (roh mit Trennzeichen, mit Symbologie-Präfix, Klammerform) und GS1-Digital-Link-URLs. GS1-Jahrhundertregel und «Tag 00 = Monatsende» sind umgesetzt. `expiryFromScan` bevorzugt das sicherheitsrelevante Verbrauchsdatum (AI 17) vor dem MHD (AI 15); das Verkaufsdatum (AI 16) ist kein Ablaufdatum.
4. **Der Barcode-Scanner (Schritt 10) liest schon im MVP auch DataMatrix und QR**, nicht nur EAN. Sobald Hersteller 2D-Codes drucken, füllt FridgeAI das Datum ohne Umbau automatisch aus.
5. **Fallback-Reihenfolge beim Erfassen:** Datum aus dem Code → (v1) Datum vom Etikett fotografiert → manuell (Kalender oder `dd.mm.yyyy`, siehe `parseDateInput`) → Schätzung aus der Kategorie.
6. **Nährwerte und Kalorien** pro 100 g/ml, Nutri-Score und Allergene werden beim Scan aus der Produktdatenbank übernommen und auf der Produktseite angezeigt (Quelle wird gespeichert). Ein Kalorien-Tagebuch gibt es nicht.

## Konsequenzen

- Die UI zeigt bei echten Daten kein «geschätzt» und nutzt die Datumsart des Artikels für Warnungen («Nicht mehr essen» nur bei Verbrauchsdatum).
- Weitere Quellen (Etikett-Foto, Partner) brauchen nur einen Adapter, kein neues Datenmodell.
