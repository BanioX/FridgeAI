import { configure } from '@testing-library/react';

// `findBy…` and `waitFor` give up after 1 s by default. With fake IndexedDB, Dexie live queries
// and several test runs at once (agents, CI), a correct page can take longer to settle, and the
// test then fails at random (ShoppingPage, ItemDetailMinStock). 5 s keeps real failures visible
// and stops the noise (L-30).
configure({ asyncUtilTimeout: 5000 });
