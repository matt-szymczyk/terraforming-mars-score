import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('caches both languages, then reopens with the saved score while offline', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.locator('#offline-status')).toHaveText('Ready to use offline', { timeout: 15000 });
  await page.getByLabel('Final terraform rating (TR)', { exact: true }).fill('42');
  const workerScope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(workerScope).toBe('http://127.0.0.1:4173/terraforming-mars-score/');
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('http://127.0.0.1:4173/terraforming-mars-score/');
  await expect(reopened.locator('#total')).toHaveText('42');
  await expect(reopened.locator('#offline-status')).toHaveText('Offline · ready to count');
  await reopened.getByRole('button', { name: 'Polski', exact: true }).click();
  await reopened.getByLabel('Suma punktów zwycięstwa z kart', { exact: true }).fill('-2');
  await expect(reopened.locator('#total')).toHaveText('40');
});

test('does not promise offline access when service worker installation fails', async ({ page, context }) => {
  await context.route('**/sw.js', route => route.abort());
  await page.goto('./');
  await expect(page.locator('#offline-status')).toContainText('Offline access unavailable', { timeout: 10000 });
  await page.getByLabel('Final terraform rating (TR)', { exact: true }).fill('25');
  await expect(page.locator('#total')).toHaveText('25');
});

test('a partial asset download never reports offline readiness', async ({ page, context }) => {
  await context.route('**/style.css', route => route.request().serviceWorker() ? route.abort() : route.continue());
  await page.goto('./');
  await expect(page.locator('#offline-status')).toContainText('Offline access unavailable', { timeout: 15000 });
  await expect(page.locator('#total')).toHaveText('0');
});

test('activates an updated worker on request without losing the score', async ({ page }) => {
  // Browser-owned worker update requests bypass Playwright routing. Serve a real
  // second release from a disposable copy instead of mocking that request.
  const directory = await mkdtemp(join(tmpdir(), 'mars-score-update-'));
  await cp(resolve(process.env.SITE_DIRECTORY || 'site'), directory, { recursive: true });
  const server = spawn(process.execPath, ['scripts/serve.js'], {
    env: { ...process.env, SITE_DIRECTORY: directory, PORT: '0' },
  });
  try {
    const url = await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.stdout.once('data', data => resolve(data.toString().match(/Local: (http\S+)/)[1]));
    });
    await page.goto(url);
    await expect(page.locator('#offline-status')).toHaveText('Ready to use offline', { timeout: 15000 });
    await page.getByLabel('Final terraform rating (TR)', { exact: true }).fill('55');
    const path = join(directory, 'sw.js');
    const worker = await readFile(path, 'utf8');
    await writeFile(path, worker.replace(/const VERSION = '[^']+';/, "const VERSION = 'browser-update-test';"));
    await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
    await expect(page.locator('#update-button')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.locator('#offline-status')).toHaveText('Ready to use offline', { timeout: 15000 });
    await expect(page.locator('#total')).toHaveText('55');
    expect(await page.evaluate(async () => (await caches.keys()).some(key => key.endsWith(':browser-update-test')))).toBe(true);
  } finally {
    server.kill();
    await rm(directory, { recursive: true, force: true });
  }
});
