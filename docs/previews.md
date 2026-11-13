# Vorschau-Links auf Cloudflare

Damit du jede Änderung am Handy anschauen kannst: `main` läuft unter einer festen Adresse, und jeder PR bekommt automatisch einen eigenen Vorschau-Link. Cloudflare schreibt den Link als Kommentar in den PR. Entscheid und Begründung: [ADR-0013](./adr/0013-preview-deployments-cloudflare.md).

## Einmal einrichten (ca. 5 Minuten, geht am Handy)

Tipp: Falls im Handy-Browser Menüpunkte fehlen, im Browser-Menü «Desktop-Website» wählen.

1. **dash.cloudflare.com** öffnen und anmelden.
2. **Workers & Pages** → **Erstellen** (Create application) → **Repository importieren** (Import a repository).
3. **GitHub verbinden.** GitHub fragt, wo die App «Cloudflare Workers and Pages» installiert werden soll. Wähle **Only select repositories** → `BanioX/FridgeAI`. Damit sieht Cloudflare nur dieses Repo.
4. Repo **FridgeAI** auswählen und so ausfüllen:

   | Feld | Wert |
   | --- | --- |
   | Projektname (Project name) | `fridgeai` (genau so, sonst öffnet Cloudflare einen Korrektur-PR) |
   | Build-Befehl (Build command) | `pnpm build:cf` |
   | Deploy-Befehl (Deploy command) | `npx wrangler deploy` (Standard lassen) |
   | Vorschau-Befehl (Preview command) | `npx wrangler preview` (Standard lassen) |
   | Pfad (Root directory / Path) | leer lassen |
   | Variablen, Secrets | keine |

5. **Vorschau-Builds einschalten**, falls nicht schon an: im neuen Projekt **Settings → Build → Branch control → Enable Preview Builds** (heisst teils «Builds for Preview branches»).
6. **Deploy** tippen. Der erste Build dauert ein bis zwei Minuten.

Danach gibt es:

- **`main`:** `https://fridgeai.<dein-name>.workers.dev`. Das ist die echte App für den Pilot, ohne Beispieldaten und Styleguide. Diese Adresse legst du als App auf den Home-Bildschirm ([`pilot.md`](./pilot.md)).
- **Jeder PR:** ein Kommentar von Cloudflare mit dem Vorschau-Link, etwa `https://<branch>-fridgeai.<dein-name>.workers.dev`. Der Link bleibt pro Branch gleich und zeigt immer den neusten Stand.

Schick mir nach dem ersten Build die `main`-Adresse, dann nenne ich die Links ab sofort in jeder Statusmeldung.

## So schaust du eine Vorschau an

- Vorschau-Link eines PRs öffnen. Ist der Vorrat leer, tippst du auf **«Beispieldaten laden»**: Dann siehst du einen typischen WG-Kühlschrank. Das gibt es nur in den Vorschauen; `scripts/build-cf.mjs` baut `main` ohne.
- Den Styleguide mit allen Bausteinen findest du in den Vorschauen unter `/styleguide`.
- Alle Daten bleiben im Browser auf deinem Gerät. Nichts geht an einen Server. Jede Vorschau-Adresse hat ihren eigenen Speicher.
- Siehst du nach einem Update noch die alte Version: App ganz schliessen und neu öffnen. Die neue Version lädt im Hintergrund.

## Kosten und Grenzen

- **Kostenlos im Free-Plan.** 3000 Build-Minuten pro Monat (ein Build dauert etwa ein bis zwei Minuten), ein Build gleichzeitig, bis 100 Vorschauen pro Projekt. Aufrufe der App selbst sind gratis und unbegrenzt, weil nur statische Dateien ausgeliefert werden.
- **Die Links sind öffentlich**, aber nicht auffindbar. Echte Daten liegen dort nicht. Wer sie trotzdem sperren will: Cloudflare Access (Login vor der Vorschau), später.

## Wenn etwas nicht klappt

- **Build rot:** im Projekt unter **Deployments** bzw. **Builds** das Log öffnen und mir einen Screenshot schicken.
- **Build rot mit «An unknown error has occurred»** im letzten Schritt (`wrangler preview` oder `wrangler deploy`), obwohl «Success: Build command completed» davor steht: Das ist eine Störung bei Cloudflare, nicht im Code. Einmal **Retry build** tippen (L-34).
- **Korrektur-PR «name conflict» von Cloudflare:** Projektname ist nicht `fridgeai`. Den PR nicht mergen, sondern mir Bescheid geben.
- **Kein Kommentar im PR:** Prüfen, ob Schritt 5 (Vorschau-Builds) eingeschaltet ist.
