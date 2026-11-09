# Thermomix, Kühlschränke und eine offene Rettich-Schnittstelle

Stand: 7.11.2026. Albans Idee: Rezepte und Einkaufslisten später automatisch an den Thermomix schicken, dazu ein offener Standard mit Kühlschrank-Herstellern wie LG und Samsung. Die Recherche dazu lief am 7.11.2026, die Quellen sind verlinkt.

**Harte Regel (CLAUDE.md):** Es gibt keine echten Partner-Anbindungen ohne Vertrag, nur Interfaces mit Mocks. Was Daten das Gerät neu verlassen lässt, entscheidet Alban.

## Was die Hersteller heute erlauben

| Partner | Offizieller Zugang | Inventar lesen/schreiben? | Einschätzung |
| --- | --- | --- | --- |
| **Thermomix / Cookidoo** (Vorwerk) | Keine öffentliche API, kein Partnerprogramm gefunden. Offiziell: «Created Recipes» importiert ein Rezept per URL ([Cookidoo](https://cookidoo.ch/foundation/en/articles/learn-about-importing-recipes)) | – | Inoffizielle Clients verstossen gegen die Nutzungsbedingungen (Kontosperre möglich). Also nur der offizielle URL-Import |
| **Samsung** SmartThings / Family Hub | Öffentliche REST-API ([SmartThings](https://github.com/SmartThingsCommunity/smartthings-core-sdk/wiki)) | Nein. Food List und Einkaufsliste sind laut Community nicht über die API erreichbar | Samsung Food (früher Whisk) importiert Rezepte von Webseiten |
| **LG** ThinQ | API offen seit 17.12.2024, mit Personal Access Token oder als Business-Partner ([LG](https://www.lg.com/global/newsroom/news/home-appliance-solution/lg-opens-thinq-api-to-foster-smart-home-innovation/)) | Nein. Nur Temperatur, Tür, Modi, Filter | Für Rettich wenig Nutzen |
| **Bosch** Home Connect, **Miele** | REST mit OAuth2, kommerziell nur mit Vertrag | Nein. Sollwerte und teils Kamerabilder (bei älteren Bosch-Geräten seit 31.3.2026 abgeschaltet) | Höchstens Türalarm, kein Inventar |
| **Matter** (seit 1.2, Oktober 2023) | Gerätetyp «Refrigerator» | Nein. Nur Modus, Sollwert, Alarm «Tür offen» | Fürs Inventar nicht relevant |
| **GS1 2D-Codes** («Sunrise 2027») | Offener Standard. Coop, Migros, Spar, Volg u. a. haben eine Absichtserklärung unterschrieben | **Ja, das Ablaufdatum steht im Code** (Kennung 15 MHD, 17 Verbrauchsdatum) | Der realistischste offene Standard für Ablaufdaten. Rettich liest GS1-DataMatrix schon heute |

**Fazit:** Kein Hersteller lässt Dritte offiziell ins Lebensmittel-Inventar schreiben. Rettich gewinnt mehr, wenn es die eigene Schnittstelle öffnet, statt auf fremde APIs zu warten.

## Vorschlag in vier Stufen

| Stufe | Was | Für wen | Aufwand | Kosten / Daten |
| --- | --- | --- | --- | --- |
| 1 | **GS1-Codes und Open Food Facts noch besser nutzen** (läuft schon) | alle | S | gratis. Beachten: Open-Food-Facts-Daten stehen unter ODbL. Eine daraus abgeleitete Datenbank, die wir veröffentlichen, müsste ebenfalls ODbL sein. Der Cache pro Gerät ist unproblematisch |
| 2 | **Rezept als Link oder Datei exportieren** (schema.org/Recipe als JSON-LD). Die Person importiert es selbst in Cookidoo oder Samsung Food | Thermomix-Haushalte | S–M | gratis. Nichts verlässt das Gerät ohne Klick der Person. Ob Cookidoo dieses Format liest, ist noch nicht bestätigt: im Pilot testen |
| 3 | **Offene Rettich-Schnittstelle:** den bestehenden Vertrag (Zod) als OpenAPI 3.1 / JSON Schema veröffentlichen, dazu einen MCP-Server (MCP liegt seit 9.12.2025 bei der Linux Foundation) | Entwickler:innen, KI-Assistenten, Hersteller | M | Braucht Konten und Server (Plan, Schritt 7). Ein neuer Datenfluss: **Alban entscheidet**, mit Einwilligung pro Haushalt |
| 4 | **Partnergespräche** mit Vorwerk (Cookidoo) und Samsung Food. Mit LG, Bosch und Miele nur für Alarme | Alban | – | Vertrag zuerst. Bis dahin nur Interfaces mit Mocks |

**Hinweis EU Data Act** (gilt seit 12.9.2025): In Deutschland und Österreich können Nutzer:innen verlangen, dass der Hersteller die Daten ihres Geräts an einen Dritten wie Rettich gibt. Das könnte später Türen öffnen. In der Schweiz gilt es nicht. Ob Food-Listen darunter fallen, ist rechtlich offen.

## Was das für den Pitch heisst

«Offen statt eingesperrt»: Rettich ist die Schicht zwischen Einkauf (Quittung, GS1-Code) und Küche (Rezept, Thermomix). Hersteller bekommen eine fertige, dokumentierte Schnittstelle, statt selbst ein Inventar zu bauen.
