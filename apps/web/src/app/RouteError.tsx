import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouteError } from 'react-router';
import { Button } from '../ui/Button';
import { messages } from './messages.de-CH';
import { isStaleBuildError, mayReloadForUpdate, reloadForUpdate } from './new-version';

const t = messages.errors;

/**
 * Instead of React Router's «Unexpected Application Error»: after an update the app reloads
 * itself once (new version); any other error gets a calm German page with «Neu laden». The data
 * stays on the device either way. The reload happens here and not on Vite's preload event: by now
 * the router has moved to the page that was asked for, so the reload opens exactly that page.
 */
export function RouteError() {
  const error = useRouteError();
  const [updating] = useState(() => isStaleBuildError(error) && mayReloadForUpdate());

  useEffect(() => {
    if (updating) {
      reloadForUpdate();
    }
  }, [updating]);

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
      <h1 className="large-title">{updating ? t.updating : t.title}</h1>
      <p role="status">{updating ? t.updatingText : t.text}</p>
      {updating ? null : (
        <div className="flex flex-wrap gap-2">
          <Button
            icon={RefreshCw}
            onClick={() => {
              window.location.reload();
            }}
          >
            {t.reload}
          </Button>
          <a
            href="/"
            className="inline-flex min-h-12 items-center rounded-xl px-5 font-semibold text-basil-700 hover:bg-basil-50"
          >
            {t.home}
          </a>
        </div>
      )}
    </main>
  );
}
