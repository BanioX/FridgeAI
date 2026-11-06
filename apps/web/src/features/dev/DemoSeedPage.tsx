import { addDays, type LocalDate } from '@fridgeai/core';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAppData, type AppData } from '../../app/AppData';

/*
 * Demo data for previews (route /dev/seed, see routes.tsx and dev-tools.ts): a typical WG fridge
 * relative to today. Only in dev and demo builds; strings are sample data, not product copy.
 */
async function seed({ householdId, ids, inventory, today }: AppData): Promise<void> {
  const { items } = await inventory['inventory.list']({ householdId });
  if (items.length > 0) {
    return;
  }
  const on = (days: number): LocalDate => addDays(today, days);
  const samples = [
    { name: 'Hackfleisch', location: 'fridge', quantity: 300, unit: 'g', priceRappen: 690 },
    {
      name: 'Rauchlachs',
      location: 'fridge',
      expiresOn: on(-1),
      expiryKind: 'use_by',
      priceRappen: 520,
    },
    { name: 'Vollmilch', location: 'fridge', expiresOn: on(0), priceRappen: 165 },
    { name: 'Blattspinat', location: 'fridge', quantity: 250, unit: 'g', expiresOn: on(2) },
    { name: 'Mozzarella', location: 'fridge', expiresOn: on(3), priceRappen: 220 },
    { name: 'Joghurt', location: 'fridge', quantity: 4, expiresOn: on(9), priceRappen: 380 },
    { name: 'Grana Padano', location: 'fridge', quantity: 100, unit: 'g', expiresOn: on(120) },
    { name: 'Ruchbrot', location: 'pantry', expiresOn: on(2) },
    { name: 'Basmatireis', location: 'pantry', quantity: 1000, unit: 'g' },
    { name: 'Erbsen', location: 'freezer', quantity: 750, unit: 'g' },
    { name: 'Pouletbrust', location: 'freezer', quantity: 400, unit: 'g' },
    { name: 'Gefriergetrocknet Risotto', location: 'reserve', expiresOn: on(9125) },
    { name: 'Notwasser', location: 'reserve', quantity: 6, expiresOn: on(60) },
  ] as const;
  for (const sample of samples) {
    await inventory['inventory.addItem']({ commandId: ids.next(), householdId, ...sample });
  }
}

// React runs effects twice in development; seed only once per page load.
let seeding: Promise<void> | null = null;

export function DemoSeedPage() {
  const data = useAppData();
  const [done, setDone] = useState(false);
  useEffect(() => {
    seeding ??= seed(data);
    void seeding.then(() => {
      setDone(true);
    });
  }, [data]);
  return done ? <Navigate to="/" replace /> : <p>Beispieldaten werden geladen …</p>;
}
