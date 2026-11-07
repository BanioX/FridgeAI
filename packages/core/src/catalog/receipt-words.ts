import type { CategoryId } from '../model/primitives';

/**
 * Words on Swiss receipts that the category keywords do not cover (ADR-0027, plan 4d): brand-free
 * product words, abbreviations (`Trockenfl.`) and dialect (`Semmeli`, `Spätzli`). Kept apart from
 * the catalog so its keyword lists stay short; the matcher reads both. Found on real receipts of
 * Coop, Migros and Lidl, November 2026.
 */
export const RECEIPT_WORDS: Readonly<Record<string, CategoryId>> = {
  skyr: 'dairy-yoghurt',
  milchdrink: 'dairy-milk',
  parmigiano: 'dairy-cheese-hard',
  reggiano: 'dairy-cheese-hard',
  parm: 'dairy-cheese-hard',
  // Longer than «essig» at the end of «Flüssig»: «Flüssig Eiweiss» is egg white.
  eiweiss: 'dairy-eggs',
  eiklar: 'dairy-eggs',
  semmeli: 'bakery-bread',
  lattich: 'produce-salad',
  salsiz: 'meat-coldcuts',
  trockenfleisch: 'meat-coldcuts',
  trockenfl: 'meat-coldcuts',
  coconutwater: 'drinks-soft',
  kokoswasser: 'drinks-soft',
  shot: 'drinks-juice',
  spätzli: 'prepared-ready-meals',
  eierspätzli: 'prepared-ready-meals',
  knöpfli: 'prepared-ready-meals',
  hummus: 'prepared-ready-meals',
  guacamole: 'prepared-ready-meals',
  salatsauce: 'pantry-oil',
  dressing: 'pantry-oil',
  oliven: 'pantry-canned',
  apfelmark: 'pantry-canned',
  apfelmus: 'pantry-canned',
};
