# Alltag und Ordnung

Kleine Hilfen mit System: weniger suchen, schneller abschliessen, weniger doppelt kaufen. Aus Albans Nachrichten vom 12.11.2026: Töpfe zum Ablegen im Auswahlmodus, ein Foto, wo was gelagert ist («ich finde manchmal nicht, wo meine Frau den Zucker hingepackt hat»), ein «Gehört»-Badge für das eigene Dessert und die Klimabilanz. Claude sortiert ein (jetzt, bald, später, Parkplatz), nach der Regel in [`README.md`](./README.md): Nutzen, für wen, Aufwand, was es braucht, Geld.

## Jetzt (in Arbeit)

| Nr. | Idee | Nutzen, für wen | Aufwand | Braucht |
| --- | --- | --- | --- | --- |
| O1 | **Töpfe im Auswahlmodus**: oben neben den Lagerorten vier Felder, Verwertet (grün), Entsorgt (rot), Verarbeiten, Nachkaufen. Tippen oder Artikel hineinziehen. Einfrieren bleibt der Tab «Tiefkühler». | Nach dem Kochen oder Aufräumen mehrere Artikel auf einmal abschliessen statt einzeln wischen. Alle | M | Nichts Neues: die bestehenden Befehle. Die Frage «Ohne Rettich im Abfall gelandet?» kommt einmal für alle knappen Artikel (ADR-0039). ADR-0055 |
| O2 | **Plätze mit Foto, «Wo ist was?»**: ein Platz wie «Oberer Schrank links» oder «Gemüsefach», wahlweise mit Foto. Er gehört zum Produkt, jede neue Packung erbt ihn. Suche «Was suchst du?» über alles. | Nichts mehr suchen, auch wenn jemand anderes eingeräumt hat. WGs, Paare, Familien | M–L | Foto nur auf dem Gerät, verkleinert, im Export und beim Löschen dabei (ADR-0020). ADR-0056 |
| O3 | **Suche als Adresse** (`/more/spots?q=zucker`) | Ein iPhone-Kurzbefehl «Wo ist der Zucker?» öffnet die Antwort direkt | S | Teil von O2 |
| O14 | **«Gehört»-Badge mit Initialen**: Wer einen Artikel nur für sich gekauft hat (das Dessert), markiert ihn; die Initialen stehen am Artikel. Ohne Markierung gehört er allen und alle dürfen ihn verwerten. | Weniger Streit in WGs und Paaren, klare Regeln im Büro-Kühlschrank (P20, P3). WGs, Paare, Büros | S–M | Das Datenmodell kennt den Besitzer schon («shared» oder eine Person); es fehlen Personen im Haushalt und die Oberfläche. Auf mehreren Handys erst mit Sync |
| O15 | **Klimabilanz**: CO₂e, Wasser und Fläche, die in der Herstellung des geretteten Essens steckten, dazu das Gewicht und die gesparten Kehrichtsäcke; auf Start und als eigene Ansicht mit Grafik | Rettung wird greifbar, nicht nur in Franken. Alle | M | Daten: Clark et al. (2022), PNAS, via Our World in Data (CC BY 4.0); Kehricht: Preisüberwacher (35-Liter-Sack ≈ 4,89 kg). Energie fehlt in der Quelle. ADR-0057 |

**Grenze heute:** Plätze und Fotos liegen auf einem Gerät. Damit die Partnerin oder der Mitbewohner sie auf dem eigenen Handy sieht, braucht es Konto und Sync (Meilenstein C, Plan). Bis dahin: dasselbe Gerät oder Export und Import.

## Bald (klein, passt zum Stand, kein neuer Datenfluss)

| Nr. | Idee | Nutzen | Aufwand |
| --- | --- | --- | --- |
| O4 | **Einräumen nach dem Einkauf**: nach der Quittung eine Liste nach Lagerort und Platz: «Kühlschrank: Milch, Joghurt · Gemüsefach: Rüebli · Oberer Schrank: Zucker». | Alles kommt an seinen Platz, auch wer selten einräumt; Rettich kennt danach jeden Ort | M |
| O5 | **Fächer im Kühlschrank vorschlagen**: Türfach, oberes, mittleres, unteres Fach, Gemüsefach als fertige Plätze, mit dem Wissen, das schon in «Wissen» steht (Fleisch und Fisch unten über dem Gemüsefach, Getränke in die Tür). | Richtig gelagert hält länger; Kühlschrank zuerst | S–M |
| O6 | **Doppelkauf-Hinweis**: Auf der Einkaufsliste steht bei einem Produkt, das noch da ist, «Zuhause: 2, Türfach». | Weniger doppelt kaufen, weniger entsorgen | S |
| O7 | **Mehrere auf einmal ändern**: im Auswahlmodus Datum oder «Angebrochen» für alle setzen. | Nach dem Einkauf oder dem Öffnen einer Packung schneller | S |
| O8 | **Topf «Rezept»**: Auswahl hineinziehen, Rettich zeigt Rezepte, die genau diese Artikel brauchen. | Aus dem, was da ist, kochen; verbindet O1 mit den Rezepten (ADR-0048) | S–M |
| O9 | **Check Fach für Fach**: Der Kühlschrank-Check geht die Plätze der Reihe nach durch, mit Foto. | Schneller, weil man vor dem Fach steht | M |

## Später

| Nr. | Idee | Warum später |
| --- | --- | --- |
| O10 | **Reste-Etikett mit QR-Code**: Rettich druckt oder zeigt ein Etikett «Reste vom 12.11.» für die Dose; Scannen schliesst sie ab. | Braucht O1 und einen Druckweg; der Barcode-Scanner ist da |
| O11 | **Wer hat was wohin gelegt**: Verlauf pro Platz mit Person. | Braucht Konten und Sync (Meilenstein C) |
| O12 | **Haptik und Ton beim Ablegen** | Safari erlaubt Vibration in Web-Apps nicht; erst mit einer nativen App ([`app-stores.md`](./app-stores.md)) |
| O13 | **Siri: «Wo ist der Zucker?»** mit gesprochener Antwort | Eine Web-App kann keine Siri-Befehle anmelden; O3 ist der Weg bis zur nativen App |

## Parkplatz

- **Fächer per Foto erkennen**: Ein Foto des offenen Schranks, Rettich erkennt die Produkte und legt die Plätze selbst an. Gehört zu P18 (Bestandesaufnahme per Foto) in [`parkplatz.md`](./parkplatz.md): KI-Kosten pro Bild, das Bild verlässt das Gerät. Entscheid bei Alban.
