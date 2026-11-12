import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { seedDemo } from '../../app/demo-seed';

// React runs effects twice in development; seed only once per page load.
let seeding: Promise<void> | null = null;

export function DemoSeedPage() {
  const data = useAppData();
  const [done, setDone] = useState(false);
  useEffect(() => {
    seeding ??= seedDemo(data);
    void seeding.then(() => {
      setDone(true);
    });
  }, [data]);
  return done ? <Navigate to="/" replace /> : <p>Beispieldaten werden geladen …</p>;
}
