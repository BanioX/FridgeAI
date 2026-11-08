# ADR-0046: Rettich ist eine Awareness-App: «verwertet» und «entsorgt»

- **Status:** angenommen
- **Datum:** 8.11.2026
- **Entscheid:** Alban (Positionierung, Wörter), Claude (Umsetzung)

## Kontext

Alban, 8.11.2026: «Ich will keine gegessen App sein sondern eine Awareness App. Später kann man das ausbauen aber ich will kein Yazio sein … Ich will Rettich sein. … Ich will Yazio nicht herausfordern. Ich will eigene Daseinsberechtigung.» Und: «Wir sprechen nicht mehr von weggeworfen sondern entsorgt und nicht mehr von essen sondern konsumiert oder verwertet.»

Bisher sagte Rettich «gegessen» und «weggeworfen». «Gegessen» stimmt oft nicht: Wer kocht, verbraucht eine Packung, auch wenn ein Teil übrig bleibt oder jemand anderes isst. Und «gegessen» rückt Rettich in die Nähe von Ernährungs- und Kalorien-Apps.

## Entscheid

1. **Rettich zeigt, was mit deinen Lebensmitteln passiert,** nicht, was du isst. Keine Kalorien, keine Mahlzeiten, kein Ernährungstagebuch. Jede neue Funktion wird daran gemessen: Hilft sie, weniger zu entsorgen und den Wert des Vorrats zu sehen?
2. **«Verwertet»** ersetzt «gegessen» in der ganzen App: gegessen, gekocht, gebacken, verbraucht. Alban nannte «konsumiert oder verwertet»; Rettich nimmt nur ein Wort, damit es überall gleich heisst. «Verwertet» sagt, dass etwas genutzt wurde, und klingt nicht nach Essen.
3. **«Entsorgt»** ersetzt «weggeworfen»: sachlich, ohne Schuld. «Abfall» bleibt als Ort (Claim «Wirf kein Geld in den Abfall.»).
4. **«Gerettet»** bleibt, wie es ist: verwertet oder weitergegeben und selbst bestätigt (ADR-0039).
5. **Im Code** heissen die Abschlüsse weiter `eaten`, `wasted`, `shared_out`. Die gespeicherten Daten und die Schnittstelle bleiben gleich; nur die Texte ändern. Das Glossar ordnet die Wörter zu.
6. Ein Test prüft den Textkatalog: «gegessen» und «weggeworfen» kommen nicht mehr vor.

## Folgen

- **Zwei Kreise** (Alban: «runde schwarze und rote Kreise»): «Verwertet» in Onyx und «Entsorgt» in Rot, als Anteil am Wert alles Abgeschlossenen, auf Start und auf der Quittung «Wirkung». «Verwertet» zählt alles, was nicht entsorgt wurde, auch Weitergegebenes und Frisches; «Gerettet» bleibt die bestätigte Rettung darunter.
- **Kein «Weitergegeben» mehr** (Alban, 8.11.2026: «Entferne weitergegeben, das will ich verwerfen»): Rettich kennt nur noch zwei Abschlüsse, «Verwertet» und «Entsorgt». Weitergeben ist auch Verwerten. Im Code und in den gespeicherten Daten bleibt `shared_out` bestehen, damit alte Einträge gültig bleiben; sie zählen und erscheinen als «Verwertet». Die Schnittstelle nimmt `shared_out` weiter an, die App bietet es nicht mehr an.

- Partner-Ideen (Provision beim Nachkaufen, Werbung, bezahlte Dashboards) passen zu einer Awareness-App, solange sie den Vorrat betreffen, nicht die Ernährung. Sie stehen im Parkplatz (P1, Geschäftsmodell-Säulen 7 und 8).
- Später ausbaubar: Nährwerte bleiben, wo sie beim Einkaufen helfen (Produktinfo), aber Rettich zählt nie, was du isst.
