/** What a «noch …» text may need besides the missing number. */
export interface MissingExtra {
  amount: string;
  current: number;
  next: number;
}

export const messages = {
  appName: 'Rettich',
  navLabel: 'Hauptnavigation',
  nav: {
    start: 'Start',
    inventory: 'Vorrat',
    add: 'Erfassen',
    knowledge: 'Wissen',
    more: 'Mehr',
  },
  pages: {
    start: 'Start',
    inventory: 'Vorrat',
    add: 'Erfassen',
    receipt: 'Quittung hochladen',
    shopping: 'Nachkaufen',
    knowledge: 'Wissen',
    more: 'Mehr',
    history: 'Journal',
    data: 'Deine Daten',
    spots: 'Wo ist was?',
    addItem: 'Artikel erfassen',
    check: 'Kühlschrank-Check',
    achievements: 'Abzeichen',
    climate: 'Klimabilanz',
    people: 'Personen',
  },
  placeholder: 'Kommt bald.',
  loading: 'Rettich wird geladen …',
  errors: {
    title: 'Da ist etwas schiefgelaufen',
    text: 'Lade Rettich bitte neu. Deine Daten bleiben auf dem Gerät erhalten.',
    updating: 'Neue Version',
    updatingText: 'Rettich wurde aktualisiert und lädt neu. Einen Moment.',
    reload: 'Neu laden',
    home: 'Zur Startseite',
    storage:
      'Der lokale Speicher ist nicht verfügbar. Ist der private Modus aktiv? Rettich braucht ihn, um deinen Vorrat zu speichern.',
  },
  defaults: { householdName: 'Mein Haushalt', memberName: 'Ich' },
  expiry: {
    doNotEat: 'Nicht mehr verwenden',
    pastBestBefore: (days: number) => (days === 1 ? 'seit gestern' : `seit ${String(days)} Tagen`),
    today: 'heute',
    tomorrow: 'morgen',
    inDays: (days: number) => `in ${String(days)} Tagen`,
    until: (when: string) => `bis ${when}`,
  },
  dateField: {
    placeholder: 'TT.MM.JJJJ',
    estimated: 'geschätzt',
    openCalendar: 'Kalender öffnen',
    presetsLabel: 'Schnellwahl',
    invalid: 'Kein gültiges Datum, z. B. 06.11.2026',
    expired: 'Liegt in der Vergangenheit, der Artikel ist schon abgelaufen.',
    presets: {
      day: (n: number) => (n === 1 ? 'morgen' : `${String(n)} Tage`),
      week: (n: number) => (n === 1 ? '1 Woche' : `${String(n)} Wochen`),
      month: (n: number) => (n === 1 ? '1 Monat' : `${String(n)} Monate`),
      year: (n: number) => (n === 1 ? '1 Jahr' : `${String(n)} Jahre`),
    },
    relative: {
      today: 'heute',
      tomorrow: 'morgen',
      yesterday: 'gestern',
      days: (n: number) => `${String(n)} Tagen`,
      weeks: (n: number) => (n === 1 ? '1 Woche' : `${String(n)} Wochen`),
      months: (n: number) => (n === 1 ? '1 Monat' : `${String(n)} Monaten`),
      years: (n: number) => (n === 1 ? '1 Jahr' : `${String(n)} Jahren`),
      future: (amount: string) => `in ${amount}`,
      past: (amount: string) => `vor ${amount}`,
    },
  },
  units: { pcs: 'Stk.', g: 'g', ml: 'ml' },
  locations: {
    fridge: 'Kühlschrank',
    freezer: 'Tiefkühler',
    pantry: 'Vorrat',
    reserve: 'Notvorrat',
  },
  today: {
    /** The four tiles on Start, one per storage location (Alban, 12.11.2026). */
    locationTiles: {
      title: 'Lagerorte',
      label: (location: string, items: number, urgent: number) =>
        `${location}: ${items === 1 ? '1 Artikel' : `${String(items)} Artikel`}${
          urgent === 0 ? '' : `, ${String(urgent)} bald fällig`
        }`,
    },
    /** A calm monthly reminder: everything lies on this device only (local-first). */
    backup: {
      title: 'Sicherung',
      never: 'Deine Daten liegen nur auf diesem Gerät, und es gibt noch keine Sicherung.',
      since: (days: number) =>
        `Deine Daten liegen nur auf diesem Gerät. Die letzte Sicherung ist ${String(days)} Tage her.`,
      action: 'Jetzt sichern',
    },
    valueLabel: 'liegen gerade in deinem Kühlschrank',
    estimated: 'teilweise geschätzt',
    expiringTitle: 'Heute retten',
    expiringEmpty: 'Nichts läuft in den nächsten 3 Tagen ab.',
    showAll: (count: number) => `Alle anzeigen (${String(count)})`,
    /** Start before the first item (Alban, 8.11.2026). */
    intro: {
      eyebrow: 'Willkommen bei Rettich',
      title: 'Wirf kein Geld in den Abfall.',
      text: 'Rettich weiss, was du zu Hause hast, was bald abläuft und was du rettest. Alles bleibt auf deinem Gerät.',
      receipt: 'Quittung hochladen',
      item: 'Artikel erfassen',
      howTitle: 'So funktioniert Rettich',
      steps: [
        {
          title: 'Quittung hochladen',
          text: 'Das PDF aus der Coop- oder Migros-App, ein Screenshot oder ein Foto. Rettich liest Artikel, Preise und Laden.',
        },
        {
          title: 'Vorrat im Blick',
          text: 'Das Ablaufdatum schätzt Rettich nach Kategorie. Was bald abläuft, steht hier zuoberst.',
        },
        {
          title: 'Verwerten statt entsorgen',
          text: 'Wisch nach links, wenn du etwas verwertet hast, nach rechts, wenn du es entsorgt hast. Rettich zeigt dir, wie viel du rettest.',
        },
      ],
      growth: 'Mit jeder Rettung wächst er.',
    },
    /** «Bilanz November» (ADR-0047): what this month closed, like a statement. */
    impactTitle: (month: string) => `Bilanz ${month}`,
    growth: {
      title: 'Dein Rettich',
      stages: {
        seed: 'Samen',
        sprout: 'Keimling',
        young: 'Jungpflanze',
        grown: 'Rettich',
        model: 'Vorbild',
      },
      rescues: (count: number) =>
        count === 1 ? '1 Rettung diesen Monat' : `${String(count)} Rettungen diesen Monat`,
      next: (missing: number, stage: string) => `noch ${String(missing)} bis ${stage}`,
      label: (stage: string, leaves: number) =>
        `Dein Rettich: ${stage}, ${leaves === 1 ? '1 Blatt' : `${String(leaves)} Blätter`}`,
    },
    /** «Seit deinem ersten Monat» (ADR-0050): full months only, said plainly either way. */
    impactSince: {
      less: (percent: number, now: string, first: string) =>
        `Seit deinem ersten Monat entsorgst du ${String(percent)} % weniger: ${now} statt ${first}.`,
      more: (percent: number, now: string, first: string) =>
        `Seit deinem ersten Monat entsorgst du ${String(percent)} % mehr: ${now} statt ${first}.`,
      same: (now: string) => `Seit deinem ersten Monat entsorgst du gleich viel: ${now}.`,
    },
    saved: 'Gerettet',
    /** The two rings (ADR-0046): everything used, and what was thrown away. */
    used: 'Verwertet',
    wasted: 'Entsorgt',
    savedShare: (percent: number) => `${String(percent)} % gerettet`,
    ofAtRisk: 'von allem, was knapp wurde',
    savedCount: (count: number) =>
      count === 0
        ? 'noch nichts'
        : count === 1
          ? '1 Artikel kurz vor Ablauf'
          : `${String(count)} Artikel kurz vor Ablauf`,
    wastedCount: (count: number) =>
      count === 0 ? 'nichts' : count === 1 ? '1 Artikel' : `${String(count)} Artikel`,
    loadDemo: 'Beispieldaten laden',
  },
  check: {
    cardText: 'Ist alles noch da? Einmal pro Woche, in etwa 30 Sekunden.',
    cardStart: 'Check starten',
    intro: 'Ein Tipp pro Artikel. Was weg ist, zählt Rettich mit.',
    progress: (step: number, total: number) => `${String(step)} von ${String(total)}`,
    question: 'Ist das noch da?',
    still: 'Noch da',
    half: 'Halb',
    eaten: 'Verwertet',
    wasted: 'Entsorgt',
    back: 'Zurück',
    empty: 'Im Kühlschrank liegt nichts. Es gibt nichts zu prüfen.',
    doneTitle: 'Fertig, dein Kühlschrank ist aktuell.',
    summary: (counts: { still: number; half: number; eaten: number; wasted: number }) => {
      const parts = [
        counts.still > 0 ? `${String(counts.still)} noch da` : '',
        counts.half > 0 ? `${String(counts.half)} halb` : '',
        counts.eaten > 0 ? `${String(counts.eaten)} verwertet` : '',
        counts.wasted > 0 ? `${String(counts.wasted)} entsorgt` : '',
      ].filter((part) => part !== '');
      return parts.join(', ');
    },
    noSpot: 'Ohne festen Platz',
    toToday: 'Zum Start',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
  },
  inventory: {
    tabsLabel: 'Lagerorte',
    /** «Einräumen» after a receipt: where each new article goes. */
    putAway: {
      title: 'Einräumen',
      subline: (count: number) =>
        `Was wohin gehört: ${count === 1 ? '1 Artikel' : `${String(count)} Artikel`} aus deiner Quittung.`,
      noSpot: 'Ohne festen Platz',
      expires: (date: string, estimated: boolean) =>
        `Haltbar bis ${date}${estimated ? ' (geschätzt)' : ''}`,
      dateSaved: (name: string, date: string) => `${name}: Haltbar bis ${date} gespeichert.`,
      done: 'Fertig',
    },
    empty: 'Hier liegt noch nichts.',
    reserveTip:
      'Der Bund empfiehlt einen Notvorrat für rund eine Woche und 9 Liter Wasser pro Person.',
    add: 'Hinzufügen',
    closed: {
      eaten: (name: string) => `${name}: als verwertet gespeichert.`,
      wasted: (name: string) => `${name}: als entsorgt gespeichert.`,
      /** «Weitergegeben» is no longer offered (Alban, 8.11.2026); older entries read as used. */
      shared_out: (name: string) => `${name}: als verwertet gespeichert.`,
    },
    /** After a confirmed rescue (ADR-0042): factual, no «Danke» (Alban, 8.11.2026). */
    rescued: (name: string, value: string, estimated: boolean) =>
      `Gerettet: ${name}, ${estimated ? 'etwa ' : ''}${value}.`,
    monthSaved: (value: string) => `Diesen Monat gerettet: ${value}`,
    deleted: (name: string) => `${name} gelöscht.`,
    undo: 'Rückgängig',
    rebuy: 'Nachkaufen',
    rebought: (name: string) => `${name} steht bei «Nachkaufen».`,
    rebuyAlready: (name: string) => `${name} steht schon bei «Nachkaufen».`,
    rebuyFailed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    /** After «Verarbeiten» (ADR-0052): where the new item lies and how many ingredients went in. */
    processed: (name: string | null, place: string, count: number) =>
      [
        name === null ? 'Gekocht.' : `${name} ist ${place}.`,
        count === 0 ? '' : `${count === 1 ? '1 Zutat' : `${String(count)} Zutaten`} verwertet.`,
      ]
        .filter(Boolean)
        .join(' '),
    processedUndone: (count: number) =>
      count === 0
        ? 'Rückgängig gemacht.'
        : `Rückgängig gemacht. ${count === 1 ? 'Die Zutat ist' : `${String(count)} Zutaten sind`} wieder im Vorrat.`,
    undone: (name: string) => `${name} ist wieder im Vorrat.`,
    undoFailed: 'Rückgängig hat nicht geklappt. Bitte versuch es nochmals.',
    /** Select mode like iOS «Auswählen» (Alban, 8.11.2026): pick several items and move them. */
    select: {
      enter: 'Auswählen',
      done: 'Fertig',
      all: 'Alle auswählen',
      none: 'Keine auswählen',
      count: (n: number) => `${String(n)} ausgewählt`,
      /** The small button next to the count: opens the sheet that changes all chosen items. */
      edit: 'Ändern',
      moveTo: 'Verschieben nach',
      /** The location the chosen items lie in now: not a target. */
      here: 'hier',
      /** «im Tiefkühler»: where the items lie afterwards. */
      in: {
        fridge: 'im Kühlschrank',
        freezer: 'im Tiefkühler',
        pantry: 'im Vorrat',
        reserve: 'im Notvorrat',
      },
      movedOne: (name: string, place: string) => `${name} liegt jetzt ${place}.`,
      movedMany: (n: number, place: string) => `${String(n)} Artikel liegen jetzt ${place}.`,
      /** «Milch gehört nicht in den Vorrat, sie bleibt.» The others still move. */
      unfit: (names: readonly string[], place: string) =>
        `${names.join(', ')} ${names.length === 1 ? 'gehört' : 'gehören'} nicht ${place.replace(/^im /, 'in den ')}, ${names.length === 1 ? 'bleibt' : 'bleiben'} hier.`,
      failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
      /** Visually hidden, read after the row name (WCAG 2.5.7: the buttons below do the same). */
      dragHint: 'Halten und auf einen Lagerort oder einen Topf oben ziehen, oder oben antippen.',
      /** The parcel under the finger: «3 Artikel» (a single item shows its name instead). */
      parcel: (n: number) => `${String(n)} Artikel`,
    },
    /** «N Artikel ändern» (O7): date, opened and owner for all chosen items at once. */
    bulk: {
      title: (n: number) => `${String(n)} Artikel ändern`,
      close: 'Schliessen',
      expiresLabel: 'Haltbar bis',
      apply: 'Übernehmen',
      openedTitle: 'Angebrochen',
      openAll: 'Alle als angebrochen markieren',
      /** «3 Artikel geändert.»; a single item shows its name. */
      changedOne: (name: string) => `${name} geändert.`,
      changedMany: (n: number) => `${String(n)} Artikel geändert.`,
      allOpened: 'Alle waren schon angebrochen.',
      /** «Milch: das hat nicht geklappt. Der Artikel bleibt ausgewählt.» */
      failedSome: (names: readonly string[]) =>
        `${names.join(', ')}: das hat nicht geklappt. ${names.length === 1 ? 'Der Artikel bleibt' : 'Die Artikel bleiben'} ausgewählt.`,
    },
    /** The pots above the list in select mode (ADR-0055): settle the selection with a tap or a drop. */
    settle: {
      label: 'Auswahl abschliessen',
      eaten: 'Verwertet',
      wasted: 'Entsorgt',
      process: 'Verarbeiten',
      rebuy: 'Nachkaufen',
      /** «Joghurt verwertet.» / «3 Artikel verwertet.» */
      doneOne: (name: string, outcome: 'eaten' | 'wasted') =>
        `${name} ${outcome === 'eaten' ? 'verwertet' : 'entsorgt'}.`,
      doneMany: (n: number, outcome: 'eaten' | 'wasted') =>
        `${String(n)} Artikel ${outcome === 'eaten' ? 'verwertet' : 'entsorgt'}.`,
      /** What did not work and stays selected: «Milch: das hat nicht geklappt.» */
      failedSome: (names: readonly string[]) =>
        `${names.join(', ')}: das hat nicht geklappt. ${names.length === 1 ? 'Der Artikel bleibt' : 'Die Artikel bleiben'} ausgewählt.`,
      /** «Milch steht bei «Nachkaufen».» */
      rebuyOne: (name: string) => `${name} steht bei «Nachkaufen».`,
      rebuyMany: (n: number) => `${String(n)} Artikel stehen bei «Nachkaufen».`,
      rebuyAlreadyOne: (name: string) => `${name} stand schon bei «Nachkaufen».`,
      rebuyAlreadyMany: (n: number) => `${String(n)} Artikel standen schon bei «Nachkaufen».`,
      /** The sheet before «Verwertet» for food that was about to go off (ADR-0039, asked once). */
      rescueConfirm: 'Als verwertet speichern',
      cancel: 'Abbrechen',
    },
  },
  /** Small rescues before something is thrown away. */
  rescue: {
    /** Only for best-before dates; use-by food stays «Nicht mehr verwenden». */
    stillGood:
      'Ist das noch gut? Schauen, riechen, probieren. Mindestens haltbar bis heisst nicht entsorgen.',
    freeze: 'Einfrieren',
    /** «Hackfleisch einfrieren» for screen readers on the Start list. */
    freezeLabel: (name: string) => `${name} einfrieren`,
    frozen: (name: string, date: string) => `${name} eingefroren. Haltbar bis ${date}.`,
    unfrozen: (name: string) => `${name} liegt wieder im Kühlschrank.`,
  },
  /** Calm state badges on items (R2-1): a short text, colour only supports it. */
  badges: {
    made: 'Selbst gemacht',
    leftover: 'Reste',
    frozen: (day: string) => `Eingefroren ${day}`,
    thawed: 'Aufgetaut',
    ready: 'Fertigprodukt',
    opened: 'Geöffnet',
    loose: 'Von der Theke',
  },
  /** Before food that does not freeze well goes into the freezer (R2-1). */
  freezeHint: {
    title: 'Das friert nicht gut ein',
    /** Where the catalog has no reason for the category. */
    general: 'Eignet sich nicht zum Einfrieren.',
    /** Several items: the others still go in. */
    others: (n: number) =>
      n === 1
        ? 'Der andere Artikel wird trotzdem eingefroren.'
        : `Die anderen ${String(n)} Artikel werden trotzdem eingefroren.`,
    keep: 'Lieber nicht',
    force: 'Trotzdem einfrieren',
    kept: (names: readonly string[]) =>
      `${names.join(', ')} ${names.length === 1 ? 'bleibt' : 'bleiben'}, wo ${names.length === 1 ? 'es' : 'sie'} ${names.length === 1 ? 'ist' : 'sind'}.`,
  },
  /** «Immer da haben» (ADR-0059): the minimum stock that fills «Nachkaufen». */
  minStock: {
    legend: 'Immer da haben',
    off: 'Aus',
    more: 'mehr',
    amountLabel: 'Mindestbestand in Packungen, 1 bis 20',
    help: 'Fällt der Vorrat darunter, kommt es auf «Nachkaufen».',
    failed: 'Das hat nicht geklappt. Versuch es noch einmal.',
    /** Said after an outcome that put the product on the list. */
    onList: 'Steht jetzt auf «Nachkaufen».',
    /** Small note on a shopping row the minimum created. */
    note: 'Mindestbestand',
  },
  swipe: {
    tip: 'Tipp: Wisch nach links, wenn du etwas verwertet hast, nach rechts, wenn du es entsorgt hast.',
    /** Visually hidden, read after the row name (WCAG 2.5.1: the item page has the buttons). */
    hint: 'Nach links wischen: verwertet. Nach rechts wischen: entsorgt. Oder öffne den Artikel für alle Optionen. Lang drücken, um mehrere auszuwählen und auf einen Lagerort zu ziehen.',
    /** The strips behind a swiped row (Alban, 8.11.2026). */
    outcomes: { eaten: 'Verwertet', wasted: 'Entsorgt' },
    piece: '−1',
    portion: '1 Portion',
    rest: 'alles',
    /** «1 Glace verwertet» or «1 Glace entsorgt» for whole pieces. */
    pieces: (count: number, name: string, outcome: 'eaten' | 'wasted') =>
      `${String(count)} ${name} ${outcome === 'eaten' ? 'verwertet' : 'entsorgt'}`,
    /** «Reis: 250 g verwertet» for amounts and fractions. */
    amount: (name: string, amount: string, outcome: 'eaten' | 'wasted') =>
      `${name}: ${amount} ${outcome === 'eaten' ? 'verwertet' : 'entsorgt'}`,
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
  },
  addItem: {
    name: 'Was ist es?',
    namePlaceholder: 'z. B. Grana Padano',
    nameMissing: 'Bitte gib an, was es ist.',
    category: 'Kategorie',
    categoryHint: 'Davon hängen der Lagerort und das geschätzte Ablaufdatum ab.',
    more: 'Mehr Angaben',
    moreWith: (summary: string) => `Mehr Angaben · ${summary}`,
    ownerSummary: (name: string) => `Gehört ${name}`,
    location: 'Wo lagerst du es?',
    /** «Das entsorgst du oft» (ADR-0038): from the household's own history, on the device. */
    habit: (times: number, names: readonly string[]) =>
      `${names.slice(0, 3).join(', ')}: in den letzten 3 Monaten ${String(times)}× entsorgt.`,
    /** Packed or loose from the counter (ADR-0038). */
    bought: 'Wie gekauft?',
    packed: 'Verpackt',
    loose: 'Von der Theke',
    looseHint: (days: number) =>
      days === 1
        ? 'Offen gekauft hält es etwa 1 Tag. Das Datum ist angepasst.'
        : `Offen gekauft hält es etwa ${String(days)} Tage. Das Datum ist angepasst.`,
    amount: 'Menge',
    unit: 'Einheit',
    amountInvalid: 'Bitte eine Menge über 0 angeben, z. B. 1.5',
    packsLabel: 'Packungsgrösse',
    pack: (count: number) => `${String(count)}er`,
    container: 'Verpackung',
    noContainer: 'keine Angabe',
    expiry: 'Haltbar bis',
    dateMissing: 'Bitte ein Datum wählen oder eintippen.',
    price: (symbol: string) => `Preis in ${symbol} (freiwillig)`,
    pricePlaceholder: (example: string) => `z. B. ${example}`,
    priceInvalid: (example: string) => `Kein gültiger Betrag, z. B. ${example}`,
    save: 'Speichern',
    failed: 'Speichern hat nicht geklappt. Bitte versuch es nochmals.',
    /** «Datum fotografieren» (ADR-0062): read on the device, the picture is not kept. */
    datePhoto: {
      choose: 'Datum fotografieren',
      chooseFor: (name: string) => `Datum fotografieren für ${name}`,
      reading: 'Datum wird gelesen …',
      found: (date: string) => `Gelesen: ${date}. Stimmt das?`,
      notFound: 'Kein Datum gefunden. Tipp es ein oder fotografiere näher.',
      failed: 'Lesen hat nicht geklappt. Tipp das Datum ein.',
    },
  },
  nameSearch: {
    used: 'Bereits verwendet',
    more: 'Gefundene Produkte',
    searching: 'Suche …',
    picked: (name: string) => `Übernommen: ${name}.`,
    none: 'Nichts gefunden. Erfasse es einfach von Hand, beim nächsten Mal kennt Rettich es.',
    unavailable:
      'Die Produktsuche ist gerade nicht erreichbar (offline oder zu viele Suchen). Erfasse es von Hand oder versuch es gleich nochmals.',
    retry: 'Nochmals suchen',
    attribution: 'Daten: Open Food Facts (Schweiz).',
  },
  quickAdd: {
    title: 'Schnell erfassen',
    hint: 'Ein Tipp speichert es wie beim letzten Mal, das Datum wird geschätzt.',
    /** Hidden after the chip text, so screen readers hear «Vollmilch 1 l erfassen». */
    add: 'erfassen',
    saved: (name: string, quantity: string, place: string) =>
      `${name} ist gespeichert: ${quantity}, ${place}.`,
    undone: (name: string) => `${name} wieder entfernt.`,
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
  },
  inputUnits: { pcs: 'Stück', g: 'g', kg: 'kg', ml: 'ml', cl: 'cl', dl: 'dl', l: 'l' },
  containers: {
    piece: 'Stück',
    cup: 'Becher',
    pack: 'Packung',
    bottle: 'Flasche',
    can: 'Dose',
    jar: 'Glas',
    bunch: 'Bund',
    bag: 'Beutel',
    box: 'Schachtel',
  },
  itemDetail: {
    /** How quickly it spoils (ADR-0038). */
    perishability: { high: 'heikel', medium: 'mittel', low: 'robust' },
    /** Haltbarkeit 1 to 10, 10 = keeps longest (Alban, 8.11.2026). */
    score: (score: number) => `Haltbarkeit ${String(score)}/10`,
    scoreLabel: (score: number, level: string) => `Haltbarkeit ${String(score)} von 10, ${level}`,
    keepsOpen: (days: number) =>
      days === 1 ? 'Offen etwa 1 Tag haltbar' : `Offen etwa ${String(days)} Tage haltbar`,
    /** «Zutat oder Fertigprodukt» (ADR-0053): recipes only use what is cooked with. */
    kind: {
      legend: 'Art des Artikels',
      cook: 'Zum Kochen',
      ready: 'Fertigprodukt',
      hint: 'Ein Fertigprodukt zählt in Rezepten nicht als Zutat.',
      savedReady: (name: string) => `${name} gilt jetzt als Fertigprodukt.`,
      savedCook: (name: string) => `${name} gilt jetzt als Zutat zum Kochen.`,
    },
    back: 'Zurück zum Vorrat',
    /** «Verarbeiten» (ADR-0052): a calm line for made and leftover items. */
    madeFrom: (names: readonly string[]) => `Aus: ${names.join(', ')}`,
    madeFromNone: 'Selbst gemacht',
    leftover: 'Reste',
    leftoverFrom: (names: readonly string[]) => `Reste aus: ${names.join(', ')}`,
    process: 'Verarbeiten',
    gone: 'Dieser Artikel ist nicht mehr im Vorrat.',
    bestBefore: 'Mindestens haltbar bis',
    useBy: 'Zu verbrauchen bis',
    estimated: '(geschätzt)',
    openedOn: (date: string) => `Geöffnet am ${date}`,
    /** The shop an item was bought at (from its receipt), next to the shop letter. */
    boughtAt: (shop: string) => `Gekauft bei ${shop}`,
    otherPacks: 'Weitere Packungen',
    otherPacksEarlier: 'Eine andere Packung läuft früher ab. Die solltest du zuerst aufbrauchen.',
    whatHappened: 'Was ist damit passiert?',
    outcomes: { eaten: 'Verwertet', wasted: 'Entsorgt', shared_out: 'Verwertet' },
    /** Only a confirmed rescue counts as «gerettet» (ADR-0039). */
    rescueQuestion: 'Ohne Rettich im Abfall gelandet?',
    rescueYes: 'Ja, gerettet',
    rescueNo: 'Nein',
    howMuch: 'Wie viel?',
    all: 'alles',
    otherAmount: (unit: string) => `Andere Menge (${unit})`,
    otherInvalid: 'Bitte eine Menge zwischen 0 und dem Rest angeben.',
    why: 'Warum? (freiwillig)',
    confirm: {
      eaten: 'Als verwertet speichern',
      wasted: 'Als entsorgt speichern',
      shared_out: 'Als verwertet speichern',
    },
    left: (rest: string) => `Gespeichert. Noch ${rest} übrig.`,
    undo: 'Rückgängig',
    undone: (amount: string) => `Rückgängig gemacht. Wieder ${amount} da.`,
    more: 'Weitere Aktionen',
    open: 'Als geöffnet markieren',
    opened: (date: string) => `Geöffnet. Neu haltbar bis ${date}.`,
    openedSame: 'Geöffnet. Das Datum bleibt gleich.',
    freeze: 'Einfrieren',
    /** K4: shown above the outcome when the date is today or tomorrow. */
    freezeTip: 'Heute oder morgen ist das Datum. Einfrieren rettet es.',
    thaw: 'Auftauen (in den Kühlschrank)',
    moved: (date: string) => `Verschoben. Neu haltbar bis ${date}.`,
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
  },
  editItem: {
    open: 'Bearbeiten',
    name: 'Was ist es?',
    nameMissing: 'Bitte gib an, was es ist.',
    category: 'Kategorie',
    location: 'Wo ist es?',
    delete: 'Artikel löschen',
    title: (name: string) => `${name} bearbeiten`,
    back: 'Zurück zum Artikel',
    expiry: 'Haltbar bis',
    dateMissing: 'Bitte ein Datum wählen oder eintippen.',
    dateKind: 'Art des Datums',
    dateKinds: { best_before: 'Mindestens haltbar', use_by: 'Zu verbrauchen' },
    quantity: (unit: string) => `Was noch da ist (${unit})`,
    quantityInvalid: 'Bitte eine Menge über 0 angeben, z. B. 1.5',
    price: (symbol: string) => `Wert in ${symbol} (freiwillig)`,
    priceHint: 'Was das noch Vorhandene gekostet hat. Leer lassen, wenn du es nicht weisst.',
    priceInvalid: (example: string) => `Kein gültiger Betrag, z. B. ${example}`,
    save: 'Änderungen speichern',
    saved: 'Gespeichert.',
    unchanged: 'Nichts geändert.',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
  },
  productFacts: {
    title: 'Nährwerte und Allergene',
    per: { '100g': 'pro 100 g', '100ml': 'pro 100 ml' },
    nutriScore: (grade: string) => `Nutri-Score ${grade}`,
    nutrients: {
      energyKcal: 'Energie',
      fat: 'Fett',
      saturatedFat: 'davon gesättigte Fettsäuren',
      carbohydrates: 'Kohlenhydrate',
      sugars: 'davon Zucker',
      fiber: 'Nahrungsfasern',
      protein: 'Eiweiss',
      salt: 'Salz',
    },
    allergens: 'Enthält',
    allergenNames: {
      gluten: 'Gluten',
      crustaceans: 'Krebstiere',
      eggs: 'Eier',
      fish: 'Fisch',
      peanuts: 'Erdnüsse',
      soybeans: 'Soja',
      milk: 'Milch',
      nuts: 'Schalenfrüchte',
      celery: 'Sellerie',
      mustard: 'Senf',
      'sesame-seeds': 'Sesam',
      'sulphur-dioxide-and-sulphites': 'Schwefeldioxid und Sulfite',
      lupin: 'Lupinen',
      molluscs: 'Weichtiere',
    } as Record<string, string | undefined>,
    hint: 'Angaben aus einer offenen Datenbank, ohne Gewähr. Massgebend ist die Packung.',
    imageCredit: 'Bild: Open Food Facts (CC BY-SA)',
    photo: {
      missing:
        'Nährwerte fehlen. Fotografiere die Nährwerttabelle auf der Packung oder wähle einen Screenshot, z. B. von Migipedia oder coop.ch. Rettich liest sie auf deinem Gerät.',
      choose: 'Foto oder Screenshot wählen',
      reading: 'Bild wird gelesen, das dauert ein paar Sekunden …',
      tooLarge: 'Die Datei ist zu gross (höchstens 15 MB).',
      notFound: 'Keine Nährwerttabelle erkannt. Versuch ein scharfes Bild nur von der Tabelle.',
      failed: 'Das Bild konnte nicht gelesen werden. Versuch es noch einmal.',
      preview: 'Das hat Rettich gelesen. Stimmt es mit der Packung überein?',
      save: 'Speichern',
      discard: 'Verwerfen',
      saveFailed: 'Das Speichern hat nicht geklappt. Versuch es noch einmal.',
      note: 'Aus deinem Bild gelesen, ohne Gewähr. Massgebend ist die Packung.',
    },
  },
  shopping: {
    what: 'Was brauchst du?',
    placeholder: 'z. B. Milch, 2 Joghurt, Brot und Eier',
    hint: 'Oder sag es: Tipp aufs Mikrofon deiner Tastatur.',
    add: 'Auf die Liste',
    addedMany: (count: number) => `${String(count)} Sachen auf der Liste.`,
    onListSome: (count: number) =>
      count === 1
        ? '1 stand schon auf der Liste.'
        : `${String(count)} standen schon auf der Liste.`,
    allOnList: 'Das steht schon alles auf der Liste.',
    added: (name: string) => `${name} ist auf der Liste.`,
    onList: (name: string) => `${name} steht schon auf der Liste.`,
    atHome: (amount: string, name: string, date: string) =>
      `Du hast noch ${amount} ${name} (bis ${date}).`,
    more: (count: number) => (count === 1 ? ' Und 1 weiteres.' : ` Und ${String(count)} weitere.`),
    stillThere: (amount: string, date: string, place?: string) =>
      `Noch da: ${amount}, bis ${date}${place === undefined ? '' : ` · ${place}`}`,
    empty: 'Deine Liste ist leer. Was fehlt dir?',
    open: 'Zu kaufen',
    basket: (count: number) => `Im Korb (${String(count)})`,
    remove: (name: string) => `${name} löschen`,
    toInventory: 'In den Vorrat legen',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    /** K5: calm hint under a row whose category the household often throws away. */
    oftenThrown: (tip: string | undefined) =>
      `Entsorgst du oft. ${tip ?? 'Kleiner kaufen oder halb einfrieren.'}`,
    /** K13: share the open entries as text. */
    share: 'Liste teilen',
    shareTitle: 'Nachkaufen',
    copied: 'Kopiert.',
    shareFailed: 'Das Teilen hat nicht geklappt.',
  },
  /** «Wissen» (ADR-0041): what keeps how long, and how it stays good longer. */
  /** «Verarbeiten», «Selbst gemacht», «Reste» and «Gekocht» (ADR-0052). */
  process: {
    title: 'Verarbeiten',
    /** ADR-0061: recipes for the items chosen in select mode. */
    recipesTitle: 'Rezepte mit deiner Auswahl',
    recipeUses: (names: string) => `Mit: ${names}`,
    recipeMissing: (names: string) => `Fehlt: ${names}`,
    intro: 'Wähl aus, was du verwendest, und sag, was daraus wird.',
    ingredients: 'Zutaten',
    search: 'Im Vorrat suchen',
    nothingAtHome: 'Im Vorrat liegt nichts.',
    noMatch: 'Dazu gibt es nichts im Vorrat.',
    chosen: (count: number) =>
      count === 0 ? 'Noch nichts gewählt' : count === 1 ? '1 gewählt' : `${String(count)} gewählt`,
    howMuch: (name: string) => `Wie viel ${name}?`,
    comesOut: 'Was kommt heraus?',
    made: 'Selbst gemacht',
    leftover: 'Reste',
    none: 'Nichts übrig',
    leftoversQuestion: 'Reste in den Kühlschrank?',
    yes: 'Ja',
    no: 'Nein',
    name: 'Name',
    namePlaceholder: 'zum Beispiel Schokoladenkuchen',
    leftoverName: (title: string) => `Reste: ${title}`,
    save: 'Speichern',
    needName: 'Gib einen Namen an.',
    needIngredients: 'Wähl mindestens eine Zutat.',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    /** On the recipe page: books what was used and asks about leftovers. */
    cooked: 'Gekocht',
  },
  recipes: {
    title: 'Rezepte',
    todayTitle: 'Heute kochen',
    allTitle: 'Alle Rezepte',
    allText: 'Die ganze Sammlung, zuerst was zu deinem Vorrat passt.',
    listIntro: 'Zuerst die Rezepte, für die dir am wenigsten fehlt.',
    todayEmpty: 'Gerade läuft nichts bald ab. Unter «Alle Rezepte» findest du Ideen.',
    empty: 'Gerade gibt es keine Rezepte.',
    listDetail: (minutes: number | undefined, missing: number, rescues: string) =>
      [
        minutes === undefined ? undefined : `${String(minutes)} Min.`,
        missing === 0
          ? 'alles da'
          : missing === 1
            ? '1 Zutat fehlt'
            : `${String(missing)} Zutaten fehlen`,
        rescues === '' ? undefined : `rettet ${rescues}`,
      ]
        .filter(Boolean)
        .join(' · '),
    rescues: (food: string, minutes: number | undefined, missing: number) =>
      `Rettet ${food}${minutes === undefined ? '' : ` · ${String(minutes)} Min.`}${missing === 0 ? ' · alles da' : ` · ${String(missing)} fehlt`}`,
    notFound: 'Dieses Rezept gibt es nicht (mehr).',
    minutes: (minutes: number) => `${String(minutes)} Min.`,
    servings: (servings: number) =>
      servings === 1 ? '1 Portion' : `${String(servings)} Portionen`,
    ingredients: 'Zutaten',
    there: 'Da',
    missing: 'Fehlt',
    atHome: (food: string) => `Da: ${food}`,
    staple: 'Grundvorrat',
    optional: 'Wenn du es hast',
    toList: 'Fehlendes auf die Liste',
    onList: (count: number) =>
      count === 0
        ? 'Das steht schon alles auf der Liste.'
        : count === 1
          ? '1 Sache auf der Liste.'
          : `${String(count)} Sachen auf der Liste.`,
    steps: 'So geht’s',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    /** «Meine Rezepte» (ADR-0048, point 7): where a recipe of yours comes in. */
    ownTitle: 'Meine Rezepte',
    ownDetail: 'Dein Rezept',
    addRecipe: 'Rezept hinzufügen',
    addRecipeText: 'Schreib eines auf oder füg eines ein, das du irgendwo kopiert hast.',
    back: 'Rezepte',
    newTitle: 'Neues Rezept',
    editTitle: 'Rezept bearbeiten',
    form: {
      title: 'Titel',
      minutes: 'Minuten',
      servings: 'Portionen',
      ingredients: 'Zutaten',
      ingredientsHint:
        'Eine Zutat pro Zeile, zum Beispiel «200 g Hörnli». Du kannst ein Rezept einfach einfügen: Aufzählungszeichen und Nummern entfernt Rettich.',
      steps: 'Schritte',
      stepsHint: 'Ein Schritt pro Zeile.',
      save: 'Speichern',
      needTitle: 'Gib dem Rezept einen Titel.',
      needIngredients: 'Schreib mindestens eine Zutat auf.',
      needNumber: 'Bitte eine ganze Zahl eingeben.',
    },
    edit: 'Bearbeiten',
    delete: 'Löschen',
    deleteAsk: 'Dieses Rezept löschen?',
    deleteYes: 'Ja, löschen',
    cancel: 'Abbrechen',
  },
  knowledge: {
    intro: 'Was wie lange hält und wie es länger gut bleibt.',
    explainTitle: 'Kurz erklärt',
    explain: [
      {
        title: 'Mindestens haltbar bis',
        text: 'Bis zu diesem Datum garantiert der Hersteller die Qualität. Danach ist vieles noch gut: schauen, riechen, probieren. Es heisst nicht: entsorgen.',
      },
      {
        title: 'Zu verbrauchen bis',
        text: 'Steht auf leicht Verderblichem wie Hackfleisch, Poulet, Fisch oder Feinkostsalaten. Nach diesem Datum nicht mehr verwenden, auch wenn es noch gut aussieht.',
      },
      {
        title: 'Richtig kühlen',
        text: 'Der Kühlschrank hat höchstens 5 °C. Fleisch und Fisch gehören ganz unten über das Gemüsefach, dort ist es am kältesten. In die Tür kommen Getränke, Butter und Saucen.',
      },
      {
        title: 'Einfrieren und auftauen',
        text: 'Möglichst frisch einfrieren, gut verpackt und mit Datum. Im Kühlschrank auftauen. Rohes, das aufgetaut ist, nicht wieder einfrieren, gekocht geht es wieder.',
      },
    ],
    guideTitle: 'Haltbarkeit A–Z',
    search: 'Lebensmittel suchen',
    searchPlaceholder: 'z. B. Joghurt, Pesto, Hackfleisch',
    noMatch: 'Dazu kenne ich nichts. Versuch ein anderes Wort.',
    groups: {
      dairy: 'Milchprodukte',
      meat: 'Fleisch',
      fish: 'Fisch',
      produce: 'Gemüse und Früchte',
      bakery: 'Brot und Gebäck',
      prepared: 'Fertiges und Dips',
      pantry: 'Vorrat',
      drinks: 'Getränke',
      frozen: 'Tiefkühl',
      reserve: 'Notvorrat',
      non_food: 'Haushalt',
    },
    keeps: (time: string, place: string) => `Hält ${time} (${place})`,
    opened: (time: string) => `offen ${time}`,
    freezer: (time: string) => `Einfrieren: hält ${time}`,
    noFreezer: 'Nicht zum Einfrieren',
    scoreLabel: (score: number, level: string) => `Haltbarkeit ${String(score)} von 10, ${level}`,
    levels: { high: 'heikel', medium: 'mittel', low: 'robust' },
    didYouKnow: 'Wusstest du schon?',
    /**
     * Food facts (ADR-0042): tips without numbers, and only numbers with a checked source (L-17).
     * One appears after a confirmed rescue, and one a day on Start and «Wissen». Since 11.11.2026
     * also awareness about hunger (Alban); every number names its source.
     */
    facts: [
      'Mehr als ein Viertel der vermeidbaren Lebensmittelverluste der Schweiz entsteht in den Haushalten (BAFU).',
      'In der Schweiz gehen pro Person und Jahr rund 310 kg Lebensmittel vermeidbar verloren, vom Feld bis zum Teller (BAFU).',
      'Die Schweiz will die vermeidbaren Lebensmittelverluste bis 2030 halbieren. Bis 2025 sanken sie erst um rund 5 % (BAFU).',
      'Ein Schweizer Haushalt entsorgt Lebensmittel im Wert von rund CHF 600 pro Jahr (WWF).',
      'Weltweit hungerten 2024 rund 673 Millionen Menschen, etwa jeder zwölfte Mensch (FAO 2025).',
      'In Afrika hungerte 2024 mehr als jeder fünfte Mensch, rund 307 Millionen (FAO 2025).',
      'Rund 2,3 Milliarden Menschen lebten 2024 mit mässiger oder schwerer Ernährungsunsicherheit (FAO 2025).',
      'Weltweit landen rund 19 % der Lebensmittel, die im Laden und zu Hause ankommen, im Abfall (UNEP 2024).',
      'Rund 60 % der Lebensmittel, die weltweit im Abfall landen, kommen aus Haushalten (UNEP 2024).',
      'Haushalte entsorgen weltweit jeden Tag mindestens eine Milliarde Mahlzeiten (UNEP 2024).',
      'Lebensmittelverluste und -abfälle verursachen 8 bis 10 % der weltweiten Treibhausgase (UNEP 2024).',
      'Überschüssige Lebensmittel aus Läden verteilen in der Schweiz Organisationen wie Tischlein deck dich und die Schweizer Tafel an Menschen mit wenig Geld.',
      'Mindestens haltbar bis heisst nicht «entsorgen»: Joghurt, Hartkäse und Teigwaren sind danach oft noch gut.',
      'Brot vom Vortag wird zu Fotzelschnitten, Croûtons oder Paniermehl.',
      'Äpfel und Bananen geben Reifegas ab. Getrennt gelagert reift das übrige Obst langsamer.',
      'Frische Kräuter halten länger in einem Glas Wasser, wie ein Blumenstrauss.',
      'Hartkäse mit wenig Schimmel: grosszügig wegschneiden. Weichkäse, Joghurt und Brot mit Schimmel ganz entsorgen.',
      'Suppe, Sauce, Tomatenmark und Pesto lassen sich portionsweise einfrieren, zum Beispiel im Eiswürfelbehälter.',
      'Am kältesten ist es im Kühlschrank unten über dem Gemüsefach. Dort gehören Fleisch und Fisch hin.',
      'Welke Rüebli und schlapper Salat werden in kaltem Wasser oft wieder knackig.',
      'Aus Gemüseschalen und Strünken wird eine Bouillon: auskochen, absieben, fertig.',
    ],
  },
  /** «Abzeichen» (docs/abzeichen.md, ADR-0054): names as in the catalogue, said calmly. */
  achievements: {
    intro:
      'Abzeichen gibt es fürs Retten, Kochen und Planen, nie fürs Einkaufen. Rettich rechnet sie aus deinen Daten auf dem Gerät aus.',
    startTitle: 'Abzeichen',
    startAll: 'Alle Abzeichen',
    families: {
      rescue: 'Retten',
      balance: 'Bilanz',
      cooking: 'Kochen und Verarbeiten',
      stock: 'Vorrat',
    },
    names: {
      'first-rescue': 'Erste Rettung',
      'rescue-service': 'Rettungsdienst',
      savings: 'Sparbuch',
      'last-day': 'Auf den letzten Tag',
      'all-senses': 'Mit allen Sinnen',
      frugal: 'Sparsam',
      'nothing-wasted': 'Nichts entsorgt',
      progress: 'Fortschritt',
      'year-end': 'Jahresabschluss',
      'at-the-stove': 'Am Herd',
      bakery: 'Backstube',
      'leftover-kitchen': 'Resteküche',
      'own-cookbook': 'Eigenes Kochbuch',
      foresight: 'Vorausschauend',
      overview: 'Alles im Blick',
      loyal: 'Treu',
      survival: 'Überlebenskunst',
      bookkeeping: 'Buchhaltung',
    },
    about: {
      'first-rescue': 'Das erste Mal etwas gerettet.',
      'rescue-service': 'Bestätigte Rettungen insgesamt.',
      savings: 'Wert, den du gerettet hast.',
      'last-day': 'Am Ablauftag verwertet.',
      'all-senses': 'Nach dem Mindesthaltbarkeitsdatum geprüft und verwertet.',
      frugal: 'Ein abgeschlossener Monat mit weniger als 5 % entsorgt, nach Wert.',
      'nothing-wasted': 'Ein abgeschlossener Monat ganz ohne Entsorgtes.',
      progress: 'Ein Monat mit weniger Entsorgtem als in deinem ersten Monat.',
      'year-end': 'Ein Jahr mit Rettich, ab dem ersten Abschluss.',
      'at-the-stove': 'Rezepte gekocht.',
      bakery: 'Etwas gebacken.',
      'leftover-kitchen': 'Reste verwertet.',
      'own-cookbook': 'Eigene Rezepte gespeichert.',
      foresight: 'Vor dem Datum eingefroren.',
      overview: '30 Tage lang kein Artikel im Kühlschrank über sein Datum.',
      loyal: 'Kühlschrank-Check Woche für Woche.',
      survival: 'Notvorrat nach der Empfehlung des Bundes: Trinkwasser und Haltbares.',
      bookkeeping: 'Quittungen übernommen.',
    },
    /** What is still missing, as «noch 3 Rettungen»; `missing` is always at least 1. */
    missing: {
      'first-rescue': () => 'noch keine Rettung',
      'rescue-service': (n: number) => (n === 1 ? 'noch 1 Rettung' : `noch ${String(n)} Rettungen`),
      savings: (_n: number, extra: MissingExtra) => `noch ${extra.amount}`,
      'last-day': (n: number) => (n === 1 ? 'noch 1 Mal' : `noch ${String(n)} Mal`),
      'all-senses': (n: number) => (n === 1 ? 'noch 1 Mal' : `noch ${String(n)} Mal`),
      frugal: (n: number) => (n === 1 ? 'noch 1 Monat' : `noch ${String(n)} Monate`),
      'nothing-wasted': (n: number) => (n === 1 ? 'noch 1 Monat' : `noch ${String(n)} Monate`),
      progress: (_n: number, extra: MissingExtra) =>
        `bisher ${String(extra.current)} % weniger, nächste Stufe bei ${String(extra.next)} %`,
      'year-end': (n: number) => (n === 1 ? 'noch 1 Tag' : `noch ${String(n)} Tage`),
      'at-the-stove': (n: number) => (n === 1 ? 'noch 1 Rezept' : `noch ${String(n)} Rezepte`),
      bakery: (n: number) => (n === 1 ? 'noch 1 Mal backen' : `noch ${String(n)} Mal backen`),
      'leftover-kitchen': (n: number) => (n === 1 ? 'noch 1 Rest' : `noch ${String(n)} Reste`),
      'own-cookbook': (n: number) => (n === 1 ? 'noch 1 Rezept' : `noch ${String(n)} Rezepte`),
      foresight: (n: number) => (n === 1 ? 'noch 1 Mal' : `noch ${String(n)} Mal`),
      overview: (n: number) => (n === 1 ? 'noch 1 Tag' : `noch ${String(n)} Tage`),
      loyal: (n: number) => (n === 1 ? 'noch 1 Woche' : `noch ${String(n)} Wochen`),
      survival: (n: number) => `noch ${String(n)} von 2 Teilen im Notvorrat`,
      bookkeeping: (n: number) => (n === 1 ? 'noch 1 Quittung' : `noch ${String(n)} Quittungen`),
    },
    stages: ['', 'Stufe I', 'Stufe II', 'Stufe III'],
    /** «Resteküche, Stufe II, freigeschaltet am 4.12.2026» */
    reachedLabel: (name: string, stage: string, date: string) =>
      stage === ''
        ? `${name}, freigeschaltet am ${date}`
        : `${name}, ${stage}, freigeschaltet am ${date}`,
    openLabel: (name: string, missing: string) => `${name}, noch offen: ${missing}`,
    toast: (name: string) => `Neues Abzeichen: ${name}.`,
    empty: 'Noch kein Abzeichen. Das erste kommt mit deiner ersten Rettung.',
  },
  more: {
    install: 'Rettich als App',
    installIos:
      'In Safari unten auf «Teilen» tippen, dann «Zum Home-Bildschirm». Danach startet Rettich wie eine App, auch offline.',
    installOther: 'Im Browser-Menü «App installieren» oder «Zum Startbildschirm» wählen.',
    /** The last fridge check, counted in days (null: there was none on this device). */
    checkDetail: (days: number | null) =>
      days === null
        ? 'Noch nie'
        : days === 0
          ? 'Zuletzt heute'
          : days === 1
            ? 'Zuletzt gestern'
            : `Zuletzt vor ${String(days)} Tagen`,
    reportsDetail: 'Bilanz, Vorrat und Einkäufe als PDF, zum Teilen',
    historyDetail: 'Verwertet und entsorgt: ansehen, ändern, löschen',
    shoppingDetail: 'Was du wieder brauchst',
    dataDetail: 'Exportieren, löschen, was mit deinen Daten passiert',
    achievementsDetail: 'Was du gerettet, gekocht und geplant hast',
    climateDetail: 'CO₂e, Wasser und Fläche von dem, was du gerettet hast',
    peopleDetail: 'Wer im Haushalt ist und wem was gehört',
    spotsDetail: 'Plätze mit Foto, damit alle alles finden',
  },
  /** «Wo ist was?» (ADR-0056): named storage spots with an optional photo. */
  spots: {
    intro:
      'Halte fest, wo etwas liegt, auf Wunsch mit einem Foto. Alles bleibt auf diesem Gerät. Bis es Konten gibt, teilst du Plätze über dasselbe Gerät oder über Export und Import.',
    searchLabel: 'Was suchst du?',
    searchPlaceholder: 'z. B. Zucker',
    searchNone: (query: string) => `Zu «${query}» ist nichts im Vorrat.`,
    searchResults: (count: number) => (count === 1 ? '1 Treffer' : `${String(count)} Treffer`),
    noSpotYet: 'Noch kein Platz festgehalten',
    spotsTitle: 'Plätze',
    empty: 'Noch keine Plätze. Öffne einen Artikel und tippe auf «Platz festhalten».',
    count: (count: number) =>
      count === 0 ? 'Leer' : count === 1 ? '1 Artikel' : `${String(count)} Artikel`,
    back: 'Wo ist was?',
    backToMore: 'Mehr',
    notFound: 'Diesen Platz gibt es nicht mehr.',
    now: 'Liegt hier',
    nothingHere: 'Im Moment liegt hier nichts.',
    photoMissing: 'Noch kein Foto',
    photoOf: (name: string) => `Foto von ${name}`,
    photoAdd: 'Foto hinzufügen',
    photoReplace: 'Foto ersetzen',
    photoRemove: 'Foto entfernen',
    rename: 'Umbenennen',
    renameSave: 'Name speichern',
    remove: 'Platz löschen',
    removeQuestion: (name: string) =>
      `${name} löschen? Die Artikel bleiben, sie verlieren nur diesen Platz.`,
    removeConfirm: 'Ja, löschen',
    cancel: 'Abbrechen',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    /** The row on an item page and the sheet behind it. */
    row: 'Platz',
    hold: 'Platz festhalten',
    sheetTitle: 'Wo liegt das?',
    sheetFor: (name: string, location: string) => `${name} im Bereich «${location}»`,
    noSpot: 'Kein Platz',
    newSpot: 'Neuer Platz',
    current: 'Aktueller Platz',
    nameLabel: 'Name',
    namePlaceholder: 'z. B. Oberer Schrank links',
    /** Ready-made fridge compartments, one tap each (O5); the one that suits the item first. */
    shelvesTitle: 'Fächer im Kühlschrank',
    suits: 'passt hierhin',
    shelves: {
      door: 'Türfach',
      top: 'Oberes Fach',
      middle: 'Mittleres Fach',
      bottom: 'Unteres Fach',
      drawer: 'Gemüsefach',
    },
    takePhoto: 'Foto aufnehmen',
    photoPreview: 'Vorschau des Fotos',
    save: 'Speichern',
    saved: (name: string, spot: string) => `${name} liegt jetzt: ${spot}.`,
    cleared: (name: string) => `${name} hat keinen Platz mehr.`,
    photoErrors: {
      not_image: 'Das ist kein Bild. Wähle ein Foto.',
      unreadable: 'Das Foto lässt sich nicht lesen. Versuch ein anderes.',
      too_big: 'Das Foto ist zu gross. Versuch ein anderes.',
    },
  },
  /** «Klimabilanz» (ADR-0057): what went into making the food that was rescued. Calm, no claims. */
  climate: {
    title: 'Klimabilanz',
    intro: 'So viel CO₂e steckte in der Herstellung von dem, was du gerettet hast.',
    cardMonth: 'Diesen Monat gerettet',
    cardSoFar: 'Bisher gerettet',
    cardLink: 'Klimabilanz ansehen',
    periodLegend: 'Zeitraum',
    periodMonth: 'Dieser Monat',
    periodAll: 'Seit Beginn',
    empty:
      'In diesem Zeitraum hast du noch nichts gerettet. Sobald du Lebensmittel kurz vor Ablauf rettest, rechnet Rettich hier aus, was in ihrer Herstellung steckte.',
    metrics: {
      food: 'Lebensmittel',
      co2e: 'CO₂e',
      water: 'Wasser',
      land: 'Fläche',
    },
    tilesTitle: 'Gerettet',
    rescuedWord: 'gerettet',
    wastedWord: 'entsorgt',
    estimatedShare: (percent: number) =>
      `${String(percent)} % davon beruhen auf Schätzungen: ein ähnliches Produkt oder ein typisches Gewicht.`,
    chartTitle: 'Gerettet und entsorgt',
    chartLabel: (rows: string) => `Gerettet und entsorgt im Vergleich: ${rows}`,
    chartRow: (metric: string, rescued: string, wasted: string) =>
      `${metric}: ${rescued} gerettet, ${wasted} entsorgt`,
    chartNone: 'nichts',
    topTitle: 'Das meiste CO₂e steckte in',
    topEntry: (name: string, co2e: string) => `${name}: ${co2e}`,
    kehrichtTitle: 'Kehricht',
    kehricht: (bags: string, fee: string) =>
      `Das Gerettete entspricht etwa ${bags} Säcken à 35 Liter Kehricht, das sind etwa ${fee} Gebühren.`,
    kehrichtNote:
      'Eine Schätzung: Die Gebühr ist je nach Gemeinde verschieden, und Lebensmittelabfälle können auch ins Grüngut statt in den Kehricht.',
    methodTitle: 'So rechnet Rettich',
    method: [
      'Jedes Lebensmittel in Rettich gehört zu einer Kategorie, zum Beispiel Milch, Brot oder Äpfel. Für jede Kategorie nimmt Rettich ein passendes Produkt aus einer Studie und rechnet mit dessen Werten pro Kilogramm.',
      'Das Gewicht kommt aus deinen Angaben. Fehlt es, nimmt Rettich ein typisches Gewicht der Kategorie.',
      'Gezählt wird, was du als gerettet bestätigt hast, und getrennt davon, was du entsorgt hast. Rückgängig Gemachtes zählt nicht, und Zutaten, die du zu etwas Neuem verarbeitet hast, zählen nicht doppelt.',
      'Die Werte beschreiben die Herstellung der Lebensmittel: Treibhausgase in CO₂-Äquivalenten (CO₂e), entnommenes Süsswasser und Landfläche. Sie sagen nicht, wie gross dein ganzer Fussabdruck ist.',
      'Es sind Schätzungen. Wo kein Produkt der Studie passt, steht ein ähnliches dafür.',
      'Energie fehlt: Die Quelle enthält keine Energiewerte, darum zeigt Rettich dazu nichts.',
      'Kehricht: Der Preisüberwacher rechnet Abfallgebühren auf einen Sack à 35 Liter mit 4,89 kg Abfall um. Als Beispiel dient eine Gebühr von CHF 1.60 pro Sack (Horgen und Maur, 2024). Bei dir kann sie anders sein.',
    ],
    sourcesTitle: 'Quellen',
    sources: {
      clark:
        'Clark et al. (2022), «Estimating the environmental impacts of 57,000 food products», PNAS',
      owid: 'Our World in Data: Umweltwirkung von Lebensmitteln',
      preisueberwacher: 'Preisüberwacher: Erläuterungen zum Preisvergleich Abfall',
      horgen: 'Gemeinde Horgen: Abfallgebühren',
      maur: 'Gemeinde Maur: Abfallgebühren',
    },
    attribution: 'Daten: Clark et al. (2022), PNAS, via Our World in Data, CC BY 4.0',
  },
  /** «Gehört» (ADR-0058): a mark that something is for one person. Without it, it is for all. */
  owner: {
    legend: 'Gehört',
    everyone: 'Allen',
    /** Screen-reader text of the initials circle. */
    badgeLabel: (name: string) => `Gehört ${name}`,
    /** The calm line on the item page; nothing is blocked. */
    ask: (name: string) => `Gehört ${name}. Frag lieber, bevor du es verwertest.`,
    failed: 'Das konnte nicht gespeichert werden. Bitte versuch es nochmals.',
  },
  people: {
    intro: 'Wer im Haushalt etwas für sich kauft, markiert es. Ohne Markierung gehört es allen.',
    deviceNote:
      'Rettich läuft vorerst auf einem Gerät, zum Beispiel einem gemeinsamen Tablet in der Küche. Eigene Geräte pro Person kommen mit dem Abgleich (Meilenstein C).',
    listLabel: 'Personen im Haushalt',
    you: '(du)',
    add: 'Person hinzufügen',
    name: 'Name',
    namePlaceholder: 'z. B. Mia',
    nameMissing: 'Bitte gib einen Namen an.',
    nameTaken: 'Diesen Namen gibt es schon im Haushalt.',
    save: 'Speichern',
    cancel: 'Abbrechen',
    /** Read after the visible name of a person row: «Mia umbenennen». */
    editSuffix: 'umbenennen',
    rename: 'Name ändern',
    remove: 'Person entfernen',
    removeQuestion: (name: string) =>
      `${name} entfernen? Die Sachen von ${name} gehören danach allen.`,
    removeConfirm: 'Ja, entfernen',
    added: (name: string) => `${name} ist dabei.`,
    renamed: (name: string) => `Name geändert: ${name}.`,
    removed: (name: string) => `${name} ist nicht mehr dabei.`,
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    ownerHint: 'Die Person, die Rettich auf diesem Gerät nutzt, bleibt immer im Haushalt.',
  },
  household: {
    data: 'Mitnehmen und löschen',
    dataText:
      'Alles bleibt auf diesem Gerät. Mit einem Export nimmst du deine Daten auf ein neues Gerät mit. Ein Konto zum Teilen mit Mitbewohner:innen kommt später.',
    exportJson: 'Alles exportieren (JSON)',
    exported: (file: string) => `${file} ist gespeichert.`,
    /** Visible backups: when this device last exported (Rettich keeps everything local). */
    lastBackup: (date: string) => `Letzte Sicherung: ${date}.`,
    noBackup: 'Noch keine Sicherung von diesem Gerät.',
    importJson: 'Daten importieren (JSON)',
    importFile: 'Exportdatei wählen',
    importQuestion: (file: string, items: number) =>
      `${file} übernehmen? Darin sind ${items} Artikel. Was jetzt auf diesem Gerät gespeichert ist, wird ersetzt.`,
    importConfirm: 'Ja, übernehmen',
    importInvalid:
      'Diese Datei ist kein Rettich-Export. Nimm die JSON-Datei von «Alles exportieren».',
    deleteAll: 'Alles löschen',
    deleteQuestion:
      'Wirklich alles löschen? Vorrat, Liste, Statistik und Einstellungen sind danach weg. Das lässt sich nicht rückgängig machen.',
    deleteConfirm: 'Ja, alles löschen',
    deleteCancel: 'Abbrechen',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    privacy: 'Datenschutz in Kürze',
    privacyPoints: [
      'Dein Vorrat, deine Liste und deine Statistik bleiben auf diesem Gerät.',
      'Beim Scannen geht nur die Barcode-Nummer an Open Food Facts, damit Name, Nährwerte und Bild kommen.',
      'Suchst du nach einem Namen, gehen ab drei Buchstaben nur die getippten Wörter an Open Food Facts.',
      'Quittungszeilen sucht Rettich zuerst auf dem Gerät. Nur ohne sicheren Treffer geht der Produktname an Open Food Facts, ohne Preise, Laden und Datum.',
      'Fotos von Quittungen und Codes werden nur gelesen, nie gespeichert.',
      'Fotos von Plätzen («Wo ist was?») bleiben auf diesem Gerät und gehören zu deinem Export.',
      'Die Namen der Personen im Haushalt bleiben ebenfalls auf diesem Gerät.',
      'Kein Konto, kein Tracking, keine Werbung.',
    ],
  },
  history: {
    intro:
      'Was du verwertet oder entsorgt hast, mit dem Anteil am Preis. Einen falschen Eintrag kannst du ändern oder löschen. Beim Löschen kommt die Menge zurück in den Vorrat.',
    periodLegend: 'Zeitraum',
    periods: { month: 'Dieser Monat', quarter: 'Letzte 3 Monate', year: 'Dieses Jahr' },
    /** Which entries to show; the rings of the «Bilanz» open the journal with one of them. */
    showLegend: 'Zeigen',
    show: { all: 'Alle', eaten: 'Verwertet', wasted: 'Entsorgt' },
    total: (value: string, count: number) =>
      `Total ${value} · ${count === 1 ? '1 Eintrag' : `${String(count)} Einträge`}`,
    empty: 'In diesem Zeitraum hast du nichts abgeschlossen.',
    estimated: 'geschätzt',
    /** An ingredient processed into something: its value moved on to the result (ADR-0052). */
    // A no-break space keeps the arrow with the name when the line wraps.
    madeInto: (name: string) => `→\u00a0${name}`,
    processed: 'Verarbeitet',
    removeLabel: (name: string) => `Eintrag ${name} löschen`,
    changeLabel: (name: string) => `Eintrag ${name} ändern`,
    reason: 'Warum?',
    save: 'Speichern',
    changed: (name: string, outcome: string) => `Gespeichert: ${name} ist jetzt «${outcome}».`,
    confirm: 'Eintrag löschen',
    cancel: 'Abbrechen',
    removedBack: (name: string) => `Eintrag gelöscht. ${name} ist wieder im Vorrat.`,
    removed: 'Eintrag gelöscht.',
    failed: 'Das hat nicht geklappt. Bitte versuch es nochmals.',
    link: 'Journal ansehen',
  },
  wasteReasons: {
    expired: 'abgelaufen',
    spoiled: 'verdorben',
    too_much: 'zu viel gekauft',
    forgotten: 'vergessen',
    did_not_like: 'schmeckt nicht',
    other: 'anderes',
  },
  reports: {
    title: 'Auszüge',
    intro: 'Rettich erstellt den Auszug auf deinem Gerät. Teilen oder speichern entscheidest du.',
    kindLegend: 'Welcher Auszug?',
    /** Short statements are receipts; «Gesamtauszug» is the full one (Alban, 8.11.2026). */
    kinds: {
      impact: {
        label: 'Bilanz',
        hint: 'Als Quittung: was du verwertet, gerettet und entsorgt hast.',
      },
      expiring: {
        label: 'Läuft bald ab',
        hint: 'Als Quittung: alles, was in den nächsten Tagen abläuft.',
      },
      wasted: {
        label: 'Entsorgt',
        hint: 'Als Quittung: was im Abfall gelandet ist, mit Grund und Wert.',
      },
      fridge: {
        label: 'Kühlschrank',
        hint: 'Als Quittung: alles im Kühlschrank, mit Datum und Wert.',
      },
      freezer: {
        label: 'Tiefkühler',
        hint: 'Als Quittung: alles im Tiefkühler, mit Datum und Wert.',
      },
      pantry: { label: 'Vorrat', hint: 'Als Quittung: alles im Vorrat, mit Datum und Wert.' },
      full: {
        label: 'Gesamtauszug',
        hint: 'Der ganze Auszug mit Diagrammen und Listen, ohne Quittung.',
      },
    },
    daysLegend: 'Wie viele Tage voraus?',
    days: { one: '1 Tag', three: '3 Tage', seven: '7 Tage', custom: 'Eigene' },
    customDays: 'Anzahl Tage (1 bis 60)',
    nextDays: (days: number) => (days === 1 ? 'heute und morgen' : `nächste ${String(days)} Tage`),
    now: 'Stand heute',
    periodLegend: 'Zeitraum',
    /** Like a bank statement (Alban, 8.11.2026): closings on the last Swiss bank day. */
    periodModes: { month: 'Monat', year: 'Jahr', range: 'Von – bis' },
    monthLabel: 'Monatsabschluss',
    yearLabel: 'Jahresabschluss',
    from: 'Von',
    to: 'Bis',
    calendar: (field: string) => `Kalender für «${field}» öffnen`,
    rangeInvalid: '«Von» muss vor «Bis» liegen, und «Bis» höchstens heute.',
    closingHint: 'Abschluss am letzten Schweizer Bankwerktag, wie bei deinem Kontoauszug.',
    monthNames: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    closedPer: (date: string) => `per ${date}`,
    running: 'bis heute',
    yearName: (year: number) => `Jahr ${String(year)}`,
    reportTitle: (kind: string, detail: string) => `${kind} · ${detail}`,
    create: 'PDF erstellen',
    creating: 'PDF wird erstellt …',
    view: {
      back: 'Auszüge',
      share: 'Teilen',
      rendering: 'Auszug wird geöffnet …',
      page: (page: number, pages: number) => `${String(page)} von ${String(pages)}`,
      gone: 'Dieser Auszug ist nicht mehr offen. Erstell ihn einfach neu.',
      failed:
        'Der Auszug lässt sich hier nicht anzeigen. Über «Teilen» kannst du ihn trotzdem öffnen.',
    },
    failed: 'Das PDF liess sich nicht erstellen. Bitte versuch es nochmals.',
    pdf: {
      heading: 'Dein Auszug',
      /** The short reports as till receipts; the detailed report has none (Alban, 8.11.2026). */
      receipt: {
        claim: 'Wirf kein Geld in den Abfall.',
        title: 'Deine Bilanz',
        saved: 'GERETTET',
        used: 'VERWERTET',
        wasted: 'ENTSORGT',
        inStock: 'IM VORRAT',
        spent: 'EINGEKAUFT',
        rate: 'RETTUNGSQUOTE',
        total: 'TOTAL GERETTET',
        detail: (count: number, kg: string) => `${String(count)}× · ${kg}`,
        thanks: 'Danke fürs Retten.',
        count: 'ARTIKEL',
        weight: 'GEWICHT',
        expiringTitle: (days: number) =>
          days === 1
            ? 'Läuft heute oder morgen ab'
            : `Läuft in den nächsten ${String(days)} Tagen ab`,
        expiringTotal: 'TOTAL IN GEFAHR',
        expiringEmpty: 'Nichts läuft in dieser Zeit ab.',
        wastedTitle: 'Was entsorgt wurde',
        wastedTotal: 'TOTAL ENTSORGT',
        wastedEmpty: 'Nichts entsorgt.',
        placeTitle: (place: string) => `Im ${place}`,
        placeTotal: 'TOTAL WERT',
        placeEmpty: 'Hier ist gerade nichts.',
        continued: '… Fortsetzung',
        climate: 'KLIMABILANZ',
        climateRescued: 'Was du gerettet hast',
        climateEstimated: (percent: number) => `${String(percent)} % geschätzt`,
        kehricht: 'KEHRICHT',
        kehrichtValue: (fee: string) => `etwa ${fee}`,
        kehrichtBags: (bags: string) => `etwa ${bags} Säcke à 35 l`,
        climateSource: 'Daten: Clark et al. (2022), CC BY 4.0',
      },
      /** «Klimabilanz» in the detailed report (ADR-0057): figures of the food, not a claim. */
      climate: {
        title: 'Klimabilanz',
        wastedLine: (food: string, co2e: string, water: string) =>
          `Zum Vergleich entsorgt: ${food} Lebensmittel · ${co2e} · ${water} Wasser`,
        none: 'In diesem Zeitraum wurde nichts gerettet.',
      },
      created: (date: string) => `Erstellt am ${date}`,
      /** The onyx card of the detailed report (Alban, 8.11.2026: «gibt Premium-Look»). */
      heroSentence: 'hast du vor dem Abfall gerettet.',
      savedDetail: (kg: string, count: number) => `${kg} Lebensmittel · ${String(count)}× gerettet`,
      rateLabel: 'gerettet',
      inStock: 'Im Vorrat',
      spent: 'Eingekauft',
      saved: 'Gerettet',
      wasted: 'Entsorgt',
      items: (count: number) => (count === 1 ? '1 Artikel' : `${String(count)} Artikel`),
      receipts: (count: number) => (count === 1 ? '1 Quittung' : `${String(count)} Quittungen`),
      insights: 'Was auffällt',
      months: 'Pro Monat',
      urgent: 'Jetzt verwerten',
      wasteTop: 'Was im Abfall landet',
      byCategory: 'Nach Lebensmittel',
      reasons: 'Warum',
      money: 'Vorrat und Einkäufe',
      byPlace: 'Im Vorrat nach Ort',
      byShop: 'Eingekauft nach Laden',
      inventory: 'Alles im Vorrat',
      total: 'Total',
      estimated: '* geschätzt aus dem Durchschnittspreis der Kategorie',
      footer: 'Erstellt auf deinem Gerät mit Rettich · Wirf kein Geld in den Abfall.',
      page: (page: number, pages: number) => `Seite ${String(page)} von ${String(pages)}`,
      noWaste: 'Nichts entsorgt.',
      noUrgent: 'Nichts läuft in den nächsten drei Tagen ab.',
      none: 'Keine Daten in diesem Zeitraum.',
    },
    insights: {
      strong: (percent: number) =>
        `Stark: Du hast ${String(percent)} % von dem gerettet, was du abgeschlossen hast.`,
      okay: (percent: number) => `Du hast ${String(percent)} % gerettet. Da geht noch etwas.`,
      low: (percent: number) =>
        `Nur ${String(percent)} % gerettet. Der Kühlschrank-Check auf «Heute» hilft, nichts zu vergessen.`,
      topWaste: (category: string, count: number, value: string) =>
        `Am meisten entsorgt: ${category} (${String(count)}×, ${value}).`,
      reason: (reason: string) => `Häufigster Grund: ${reason}.`,
      tips: {
        expired: 'Tipp: «Heute retten» zeigt jeden Tag, was bald abläuft.',
        spoiled: 'Tipp: Den Kühlschrank auf 5 °C stellen und Offenes zuerst aufbrauchen.',
        too_much: 'Tipp: Kleinere Packungen kaufen oder rechtzeitig einfrieren.',
        forgotten: 'Tipp: Der Kühlschrank-Check auf «Heute» erinnert dich jede Woche.',
        did_not_like: 'Tipp: Weniger davon kaufen oder rechtzeitig weitergeben.',
        other: 'Tipp: Ein Grund beim Entsorgen hilft, das Muster zu erkennen.',
      },
      urgent: (count: number) =>
        count === 1
          ? '1 Artikel ist abgelaufen oder läuft in 3 Tagen ab.'
          : `${String(count)} Artikel sind abgelaufen oder laufen in 3 Tagen ab.`,
      shop: (shop: string, value: string) => `Am meisten ausgegeben bei ${shop}: ${value}.`,
      nothing: 'Noch wenig Daten. Mit jeder Quittung und jedem Abschluss wird der Auszug genauer.',
    },
  },
  priceMemory: {
    last: (price: string, shop: string, date: string) => `Zuletzt ${price} bei ${shop} (${date})`,
    usual: (price: string) => `üblich ${price}`,
    cheapest: (price: string, shop: string) => `am günstigsten ${price} bei ${shop}`,
    shops: {
      coop: 'Coop',
      migros: 'Migros',
      aldi: 'Aldi',
      lidl: 'Lidl',
      denner: 'Denner',
      other: 'anderem Laden',
    },
  },
  addHub: {
    receipt: 'Alle Einkäufe auf einmal: PDF, Screenshot oder Foto der Quittung',
    barcode: 'Packung vor die Kamera halten',
    leftoversTitle: 'Reste erfassen',
    leftovers: 'Ein Name genügt, 3 Tage haltbar',
    manualTitle: 'Von Hand',
    manual: 'Name eintippen, den Rest schlägt Rettich vor',
    startTitle: 'Zum Start: einmal Bestand aufnehmen',
    start:
      'Hast du noch Quittungen der letzten Tage? Lade sie hoch, dann kennt Rettich deinen Kühlschrank in wenigen Minuten. Was nicht auf einer Quittung steht, scannst du einfach.',
  },
  receiptUpload: {
    match: {
      note: 'Nur die Produktnamen gehen an Open Food Facts, ohne Preise, Laden und Datum.',
      progress: (done: number, total: number, found: number) =>
        `Prüfe ${String(done)} von ${String(total)} … · ${String(found)} gefunden`,
      done: (found: number, total: number) =>
        found === 0
          ? 'Bei Open Food Facts nichts Passendes gefunden.'
          : `${String(found)} von ${String(total)} gefunden.`,
      unavailable:
        'Open Food Facts ist gerade nicht erreichbar. Du kannst die Quittung trotzdem übernehmen.',
      hint: 'Für die übrigen Produkte: Tippe auf «Barcode scannen» und halte die Packung vor die Kamera. Dann bekommen auch sie Name, Nährwerte und Bild.',
      known: 'Von früheren Quittungen',
      sure: 'Open Food Facts',
      maybe: 'Vorschlag · Open Food Facts',
      scanned: 'Per Barcode',
      question: 'Ist es das?',
      taken: 'Wird übernommen',
      yes: 'Ja',
      no: 'Nein',
      yesFor: (name: string) => `Ja, das ist ${name}`,
      noFor: (name: string) => `Nein, das ist nicht ${name}`,
      none: 'Kein Treffer',
      rejected: 'Abgelehnt',
      scan: 'Barcode scannen',
      scanFor: (name: string) => `Barcode scannen für ${name}`,
      cancelScan: 'Abbrechen',
      scanUnknown:
        'Diesen Barcode kennt Open Food Facts nicht. Der Artikel kommt mit dem Namen von der Quittung.',
      scanInvalid: 'Das war kein Barcode. Versuch es nochmals.',
    },
    intro:
      'Lade deine Quittung hoch: das PDF aus der Coop- oder Migros-App, einen Screenshot (z. B. Lidl Plus) oder ein Foto. Du kannst auch mehrere auf einmal wählen. Rettich liest sie auf deinem Gerät und speichert die Dateien nicht.',
    /** The shops are named only to say where the file comes from (no logos, no partnership). */
    trademarks:
      'Coop, Migros und Lidl Plus sind Marken ihrer Inhaber. Rettich ist mit ihnen nicht verbunden.',
    choose: 'PDF oder Foto wählen',
    /** Several files chosen at once (Alban, 8.11.2026): read first, then one page for all. */
    readingOf: (index: number, total: number) =>
      `Quittung ${String(index)} von ${String(total)} wird gelesen …`,
    leftOut: 'Nicht auf dieser Seite:',
    alreadyKnown: 'schon erfasst',
    checkSum: 'Summe prüfen',
    exclude: 'Diese Quittung nicht übernehmen',
    /** The shop of a receipt, preset from what was read, changed with one tap. */
    shopQuestion: 'Wo eingekauft?',
    reading: 'Quittung wird gelesen …',
    readingPhoto: 'Foto wird gelesen, das dauert ein paar Sekunden …',
    tooLarge: 'Die Datei ist zu gross für eine Quittung (höchstens 15 MB).',
    noText:
      'In diesem PDF steht kein lesbarer Text, es ist wohl ein eingescanntes Bild. Mach stattdessen ein Foto oder einen Screenshot.',
    noLines: 'Auf dieser Quittung hat Rettich keine Artikel gefunden.',
    failed:
      'Die Datei liess sich nicht lesen. Versuch es nochmals oder mit einer anderen Quittung.',
    sumOk: (total: string) => `Summe stimmt: ${total}`,
    sumMismatch: (read: string, total: string) =>
      `Die Summe stimmt nicht: gelesen ${read}, auf der Quittung ${total}. Tipp auf einen falschen Preis, um ihn zu korrigieren.`,
    editPrice: (name: string, price: string) => `Preis von ${name} ändern, jetzt ${price}`,
    priceLabel: (name: string, symbol: string) => `Preis von ${name} in ${symbol}`,
    noTotal: 'Kein Total gefunden. Prüf die Preise.',
    retailers: {
      coop: 'Coop',
      migros: 'Migros',
      aldi: 'Aldi',
      lidl: 'Lidl',
      denner: 'Denner',
      other: 'Laden',
    },
    fallbackNames: { item: 'Artikel', discount: 'Rabatt', deposit: 'Pfand', bag: 'Tasche' },
    instead: (regular: string) => `statt ${regular}`,
    dearer: (percent: number) => `${String(percent)} % teurer als sonst`,
    cheaper: (percent: number) => `${String(percent)} % günstiger als sonst`,
    lastPaid: (price: string, shop: string) => `zuletzt ${price} bei ${shop}`,
    notFood: 'kein Lebensmittel',
    extras: (amount: string) => `Dazu Tasche, Pfand und Rabatte: ${amount}`,
    take: (count: number) =>
      count === 1 ? '1 Artikel übernehmen' : `${String(count)} Artikel übernehmen`,
    takeAll: (articles: number, receipts: number) =>
      `Alle übernehmen · ${articles === 1 ? '1 Artikel' : `${String(articles)} Artikel`} aus ${receipts === 1 ? '1 Quittung' : `${String(receipts)} Quittungen`}`,
    done: (articles: number, receipts: number) =>
      `${articles === 1 ? '1 Artikel' : `${String(articles)} Artikel`} aus ${receipts === 1 ? '1 Quittung' : `${String(receipts)} Quittungen`} übernommen.`,
    duplicate: (count: number) =>
      count === 1
        ? 'Diese Quittung hast du schon übernommen.'
        : `${String(count)} Quittungen hast du schon übernommen.`,
    saveFailed: 'Speichern hat nicht geklappt. Bitte versuch es nochmals.',
  },
  scanner: {
    open: 'Barcode scannen',
    start: 'Kamera starten',
    stop: 'Kamera stoppen',
    starting: 'Kamera startet …',
    hint: 'Code in den Rahmen, Handy etwa 20 cm entfernt halten. Ist es unscharf: etwas weiter weg.',
    torch: 'Licht',
    torchFallback:
      'Hier kann Rettich das Licht nicht selbst einschalten. Die Kamera öffnet sich: Blitz einschalten und den Code fotografieren.',
    denied:
      'Die Kamera ist blockiert. Erlaube sie in den Einstellungen deines Browsers, oder nimm ein Foto bzw. tipp die Nummer ein.',
    unavailable:
      'Auf diesem Gerät gibt es keine Kamera für die App. Nimm ein Foto oder tipp die Nummer ein.',
    photo: 'Code aus Foto lesen',
    noCode: 'Auf dem Foto hat Rettich keinen Code gefunden. Versuch es näher und schärfer.',
    manual: 'Nummer unter dem Strichcode',
    manualSubmit: 'Übernehmen',
    unknownCode: 'Diesen Code kennt Rettich nicht. Bitte tipp die Nummer unter dem Strichcode ein.',
    found: (code: string) => `Barcode ${code} erkannt.`,
    looking: 'Suche Produktdaten …',
    product: (name: string, details: string) => `Gefunden: ${name}${details}.`,
    unknownProduct:
      'Produkt noch unbekannt: Gib den Namen ein. Beim nächsten Scan kennt Rettich es.',
    attribution: 'Daten: Open Food Facts (ODbL)',
    foundWithDate: (code: string, date: string) => `Barcode ${code} erkannt, haltbar bis ${date}.`,
  },
  notFound: {
    title: 'Seite nicht gefunden',
    text: 'Diese Seite gibt es nicht.',
  },
} as const;
