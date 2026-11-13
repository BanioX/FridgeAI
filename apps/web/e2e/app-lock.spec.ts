import { expect, test } from './test';

// App-Sperre (ADR-0086): WebAuthn with a virtual platform authenticator that always verifies the
// owner, like Face ID saying yes.
test('app lock: on → reload → locked without app content → unlock → content', async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasUserVerification: true,
      isUserVerified: true,
      hasResidentKey: false,
    },
  });

  await page.goto('/more/data');
  const lockSwitch = page.getByRole('switch', { name: 'App-Sperre verwenden' });
  await expect(lockSwitch).toBeEnabled();
  await lockSwitch.click();
  await expect(page.getByText('Die App-Sperre ist an.')).toBeVisible();
  await expect(lockSwitch).toBeChecked();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Rettich ist gesperrt' })).toBeFocused();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('link')).toHaveCount(0);
  await expect(page.getByText('Mit Face ID, Touch ID oder deinem Code')).toBeVisible();

  await page.getByRole('button', { name: 'Entsperren' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Deine Daten' })).toBeVisible();

  // Switching off asks the device once more.
  await page.getByRole('switch', { name: 'App-Sperre verwenden' }).click();
  await expect(page.getByText('Die App-Sperre ist aus.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
});
