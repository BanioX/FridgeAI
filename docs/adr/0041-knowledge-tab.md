# ADR-0041: Tab «Wissen» statt «Kochen»

- **Status:** angenommen
- **Datum:** 2026-11-08
- **Entscheid von:** Alban (Idee «Food Facts als nützliche Infos»), Umsetzung Claude

## Kontext

Alban (8.11.2026): «Wie wäre es mit Food Facts als nützliche Infos? Ich will den Kochen-Tab wegbekommen.» «Kochen» fällt weg (ADR-0040). Der Katalog weiss pro Kategorie, wie lange etwas hält: zu, offen und eingefroren. Dazu kommt der Score 1–10 (ADR-0038) und bis zu drei Tipps. Die Tipps waren bisher nirgends in der App zu sehen.

## Entscheid

1. **Die Leiste** ist **Start · Vorrat · ＋ · Wissen · Mehr**. «Wissen» hat das Symbol eines offenen Buchs und die Adresse `/knowledge`.
2. **«Kurz erklärt»** sind vier aufklappbare Zeilen:
   - Mindestens haltbar bis;
   - Zu verbrauchen bis;
   - Richtig kühlen (höchstens 5 °C, Fleisch und Fisch zuunterst);
   - Einfrieren und auftauen.

   Es sind nur allgemein anerkannte Aussagen, wie sie BLV und Verbraucherstellen machen. Rechtliche Einzelheiten und Zahlen ohne geprüfte Quelle kommen nicht hinein (L-17).
3. **«Haltbarkeit A–Z»:**
   - **Inhalt:** alle Lebensmittel-Kategorien, nach Gruppen und dann nach Name, Milchprodukte zuerst.
   - **Pro Zeile:** Emoji, Name, «Hält etwa … (Ort)», «offen etwa …» und der Score-Ring.
   - **Aufgeklappt:** «Einfrieren: hält etwa …» oder «Nicht zum Einfrieren», dazu die Tipps.
   - **Suche:** nach Name und Stichwörtern; Gross- und Kleinschreibung zählen nicht, «käse», «kaese» und «kase» finden dasselbe.
4. **Die Daten** kommen aus dem Katalog (`shelf-guide.ts`). Es gibt keine neue Quelle und keinen Datenfluss.

## Später

- **Food Facts:** kurze Facts mit Quelle. Sie erscheinen als Belohnung nach «Gerettet» (ADR-0039) und hier als «Wusstest du?». Zahlen zur Schweiz kommen nur aus geprüften Quellen (BAFU, BLV).
