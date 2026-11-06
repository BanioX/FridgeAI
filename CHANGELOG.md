# Changelog

Alle Änderungen an FridgeAI, neueste zuerst. Wird mit `pnpm release` erzeugt (ADR-0017).

## [0.3.0] – 2026-11-06

**Bereit für den Pilot.** Einkaufsliste mit «Du hast noch …»; Packungsbilder von Open Food Facts in Listen und Detailansicht, auf dem Gerät gemerkt; schärferer Barcode-Scan (Hauptkamera, Zoom, Rahmen, Foto aus der Galerie); Artikel bearbeiten (auch Name, Kategorie und Ort) und löschen mit Rückgängig; «Haushalt» mit Installationshinweis, Export als JSON oder CSV, «Alles löschen» und Datenschutz in klaren Worten; Apple-Schrift und grosse Titel; App-Icons; der Browser wird gebeten, die Daten zu behalten. Nach einem Update lädt die App einmal neu statt einen Fehler zu zeigen, und die feste Adresse enthält keine Demo-Daten mehr.

### Neu

- «Bearbeiten» with name, category and place; «Artikel löschen» with undo ([#73](https://github.com/BanioX/FridgeAI/pull/73))
- delete a wrong item and correct name, category and place (contract) ([#72](https://github.com/BanioX/FridgeAI/pull/72))
- ask the browser to keep the local data (persistent storage) ([#68](https://github.com/BanioX/FridgeAI/pull/68))
- home screen icons for iPhone and Android ([#67](https://github.com/BanioX/FridgeAI/pull/67))
- Apple typography – system font, large titles, no brand bar (ADR-0021) ([#66](https://github.com/BanioX/FridgeAI/pull/66))
- «Haushalt» – install hint, export JSON/CSV, delete everything, privacy (12a) ([#65](https://github.com/BanioX/FridgeAI/pull/65))
- export and delete all household data on the device (12a, ADR-0020) ([#64](https://github.com/BanioX/FridgeAI/pull/64))
- pack pictures in the lists and on the detail page (10b) ([#63](https://github.com/BanioX/FridgeAI/pull/63))
- keep the pack picture from Open Food Facts on the device (10b, data) ([#62](https://github.com/BanioX/FridgeAI/pull/62))
- «Einkaufsliste» – add, hint at food at home, check off, into the inventory (11a) ([#59](https://github.com/BanioX/FridgeAI/pull/59))
- shopping list on the device – add, check off, remove, «Du hast noch …» (11a) ([#57](https://github.com/BanioX/FridgeAI/pull/57))

### Behoben

- main on Cloudflare without demo data and styleguide, previews keep them ([#69](https://github.com/BanioX/FridgeAI/pull/69))
- reload once into the new version instead of «Unexpected Application Error» ([#71](https://github.com/BanioX/FridgeAI/pull/71))
- sharper barcode scans – main lens, 1920×1080, 2× zoom, frame, gallery photos ([#60](https://github.com/BanioX/FridgeAI/pull/60))

### Dokumentation

- pilot guide and README for the pilot ([#70](https://github.com/BanioX/FridgeAI/pull/70))
- ideas folder, product priorities and ADRs for currencies, data retention and Apple design ([#61](https://github.com/BanioX/FridgeAI/pull/61))

## [0.2.0] – 2026-11-06

**Korrigieren, verstehen, wiederfinden.** Rückgängig nach Gegessen, Weitergegeben oder Weggeworfen; Datum, Menge und Preis nachträglich ändern; «Deine Wirkung diesen Monat» auf der Startseite; Nährwerte, Nutri-Score und Allergene nach dem Scan (30 Tage offline gemerkt); Zahlen mit Dezimalpunkt wie bei Franken und Reste als Bruch («¾ Stk.»).

### Neu

- product facts on the detail page – brand, nutrition, Nutri-Score, allergens (10b) ([#55](https://github.com/BanioX/FridgeAI/pull/55))
- remember Open Food Facts answers and keep the facts on the product (10b) ([#54](https://github.com/BanioX/FridgeAI/pull/54))
- «Datum, Menge oder Preis ändern» – edit an item ([#53](https://github.com/BanioX/FridgeAI/pull/53))
- inventory.updateItem – correct date, date kind, quantity or price (contract) ([#52](https://github.com/BanioX/FridgeAI/pull/52))
- «Rückgängig» after eaten, shared or wasted ([#50](https://github.com/BanioX/FridgeAI/pull/50))
- inventory.undoOutcome – give eaten, shared or wasted food back (contract) ([#49](https://github.com/BanioX/FridgeAI/pull/49))
- «Deine Wirkung diesen Monat» on the start page (stats.waste, step 6) ([#46](https://github.com/BanioX/FridgeAI/pull/46))

### Behoben

- Swiss decimal point and readable piece fractions in quantities (ADR-0018) ([#47](https://github.com/BanioX/FridgeAI/pull/47))

### Tests

- wait for the lazy Vorrat page instead of any heading ([#48](https://github.com/BanioX/FridgeAI/pull/48))

### Wartung

- command kit for local handlers (transaction, idempotency, events) ([#56](https://github.com/BanioX/FridgeAI/pull/56))
- one quantity formatter for all pages (ui/quantity-text) ([#51](https://github.com/BanioX/FridgeAI/pull/51))

## [0.1.0] – 2026-11-06

**Erstes Release: der manuelle Prototyp.** Erfassen von Hand, per Barcode (mit Produktdaten von Open Food Facts) oder mit deiner eigenen KI; «Heute retten», Vorrat mit Notvorrat, Detailansicht mit Gegessen, Weitergegeben und Weggeworfen in sinnvollen Portionen, Öffnungsregel, Einfrieren. Läuft offline als PWA, Vorschau-Links für jeden PR.

### Neu

- a scan fills in name, category and pack size (household first, then Open Food Facts) ([#42](https://github.com/BanioX/FridgeAI/pull/42))
- products.lookup – household first, then Open Food Facts (ADR-0016) ([#40](https://github.com/BanioX/FridgeAI/pull/40))
- barcode and QR scanning – camera, photo or typed number (step 10a, ADR-0014) ([#38](https://github.com/BanioX/FridgeAI/pull/38))
- «Scannen» with your own AI – copy prompt, paste answer, review, take over ([#37](https://github.com/BanioX/FridgeAI/pull/37))
- AI import – prompt and strict parser for the user's own AI (ADR-0012, step 5b) ([#36](https://github.com/BanioX/FridgeAI/pull/36))
- item detail with eaten / thrown away / given away, opening and freezing (step 6) ([#34](https://github.com/BanioX/FridgeAI/pull/34))
- building blocks for item actions (choice chips, portion labels, texts) ([#33](https://github.com/BanioX/FridgeAI/pull/33))
- «Artikel erfassen» form (step 3d) ([#32](https://github.com/BanioX/FridgeAI/pull/32))
- add-item helpers and texts (amount parsing, suggestions) ([#31](https://github.com/BanioX/FridgeAI/pull/31))
- inventory.open, packaging on add, reasons and recipients on outcomes ([#30](https://github.com/BanioX/FridgeAI/pull/30))
- category-aware portions (thirds, quarters, eighths, egg packs, pieces) ([#28](https://github.com/BanioX/FridgeAI/pull/28))
- everyday quantities, portions, after-opening rule, waste reasons ([#25](https://github.com/BanioX/FridgeAI/pull/25))
- «Heute retten» start page and Vorrat page with four tabs ([#24](https://github.com/BanioX/FridgeAI/pull/24))
- inventory operations of contract v1 on IndexedDB ([#22](https://github.com/BanioX/FridgeAI/pull/22))
- local IndexedDB storage, local household bootstrap, name matching ([#21](https://github.com/BanioX/FridgeAI/pull/21))
- read expiry dates from label text for future label photos ([#20](https://github.com/BanioX/FridgeAI/pull/20))
- contract v1 – commands, queries, domain events, JSON Schema export ([#19](https://github.com/BanioX/FridgeAI/pull/19))
- DateField – quick choices, typing with auto dots, native calendar ([#18](https://github.com/BanioX/FridgeAI/pull/18))
- ports for capturing, product data, recipes, partners, sync and notifications ([#17](https://github.com/BanioX/FridgeAI/pull/17))
- Notvorrat as fourth storage location with decade-long dates ([#16](https://github.com/BanioX/FridgeAI/pull/16))
- read GS1 codes with expiry dates – DataMatrix, Digital Link ([#15](https://github.com/BanioX/FridgeAI/pull/15))
- Swiss dates, expiry status, category catalog and manual date entry ([#14](https://github.com/BanioX/FridgeAI/pull/14))
- domain model schemas incl. expiry source and nutrition ([#13](https://github.com/BanioX/FridgeAI/pull/13))
- Rappen money type, CHF parsing/formatting, allocation and UUIDv7 ([#10](https://github.com/BanioX/FridgeAI/pull/10))
- UI primitives and development-only styleguide ([#8](https://github.com/BanioX/FridgeAI/pull/8))
- green design system with tokens, self-hosted fonts and icons ([#7](https://github.com/BanioX/FridgeAI/pull/7))
- React PWA shell with routing, Tailwind and Playwright smoke test ([#6](https://github.com/BanioX/FridgeAI/pull/6))

### Behoben

- address one person with «du», never «ihr»; record free-tools approval ([#29](https://github.com/BanioX/FridgeAI/pull/29))

### Dokumentation

- README as project guide, proprietary licence, licence check in CI (ADR-0015) ([#39](https://github.com/BanioX/FridgeAI/pull/39))
- office fridge brainstorm (label instead of marker, fair disposal, team plans) ([#35](https://github.com/BanioX/FridgeAI/pull/35))
- bring-your-own-AI for photo recognition (copy/paste import now, MCP later), ADR-0012 ([#26](https://github.com/BanioX/FridgeAI/pull/26))
- architecture and scaling vision, i18n/backend/auth ADRs, new use cases ([#23](https://github.com/BanioX/FridgeAI/pull/23))
- product and nutrition data sources (OFF, Open Food Repo, BLV, YAZIO) ([#11](https://github.com/BanioX/FridgeAI/pull/11))
- MVP plan, brief, strategy summary, use cases and Claude setup ([#1](https://github.com/BanioX/FridgeAI/pull/1))

### Wartung

- release and maintenance rhythm – changelog, tags, GitHub Releases (ADR-0017) ([#41](https://github.com/BanioX/FridgeAI/pull/41))
- Cloudflare preview links for every PR, production headers in E2E, ADR-0013 ([#27](https://github.com/BanioX/FridgeAI/pull/27))
- install Playwright Chromium without apt dependencies ([#12](https://github.com/BanioX/FridgeAI/pull/12))
- preview script for compact phone screenshots ([#9](https://github.com/BanioX/FridgeAI/pull/9))
- PR template, ADR-0002 stack and tooling, documented commands ([#5](https://github.com/BanioX/FridgeAI/pull/5))
- Bump actions/setup-node from 6 to 7 ([#4](https://github.com/BanioX/FridgeAI/pull/4))
- Bump actions/checkout from 6 to 7 ([#3](https://github.com/BanioX/FridgeAI/pull/3))
- pnpm monorepo, strict TypeScript, ESLint, Vitest and CI ([#2](https://github.com/BanioX/FridgeAI/pull/2))
- Initial commit

