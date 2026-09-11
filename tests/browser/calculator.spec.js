import { test, expect } from '@playwright/test';

async function enterRulebook(page) {
  await page.getByLabel('Final terraform rating (TR)', { exact: true }).fill('38');
  await page.getByLabel('Your greenery tiles', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Add a city', exact: true }).click();
  await page.getByLabel('Greenery adjacent to city 1', { exact: true }).fill('5');
  await page.getByLabel('Milestones you claimed', { exact: true }).fill('1');
  await page.getByRole('radio', { name: 'Award 1: 1st, 5 VP', exact: true }).check();
  await page.getByLabel('Total victory points from cards', { exact: true }).fill('8');
}

test('scores a game and toggles Turmoil without losing category values', async ({ page }) => {
  await page.goto('./');
  await enterRulebook(page);
  await expect(page.locator('#total')).toHaveText('64');
  await page.getByLabel('Playing with Turmoil', { exact: true }).check();
  await page.getByLabel('Your party leaders', { exact: true }).fill('2');
  await page.getByLabel('You are the chairman', { exact: true }).check();
  await expect(page.locator('#total')).toHaveText('67');
  await page.getByLabel('Playing with Turmoil', { exact: true }).uncheck();
  await expect(page.locator('#total')).toHaveText('64');
});

test('language switches and reloads preserve every score', async ({ page }) => {
  await page.goto('./');
  await enterRulebook(page);
  await page.getByRole('button', { name: 'Polski', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page).toHaveTitle('Terraformacja Marsa — licznik punktów');
  await expect(page.locator('#total')).toHaveText('64');
  await page.reload();
  await expect(page.getByLabel('Końcowy współczynnik terraformacji (WT)', { exact: true })).toHaveValue('38');
  await expect(page.locator('#total')).toHaveText('64');
});

test('two-player scoring excludes second place and preserves first-place ties', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('radio', { name: 'Award 1: 1st, 5 VP', exact: true }).check();
  await page.getByRole('radio', { name: 'Award 2: 2nd, 2 VP', exact: true }).check();
  await expect(page.locator('#total')).toHaveText('7');
  await page.getByLabel('Players at the table', { exact: true }).selectOption('2');
  await expect(page.locator('#total')).toHaveText('5');
  await expect(page.getByRole('radio', { name: 'Award 2: 2nd, 2 VP', exact: true })).toBeDisabled();
});

test('invalid numbers show an error instead of a misleading total', async ({ page }) => {
  await page.goto('./');
  const tr = page.getByLabel('Final terraform rating (TR)', { exact: true });
  await tr.fill('3.5');
  await expect(tr).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#total')).toHaveText('—');
  await tr.fill('123');
  await page.getByLabel('Total victory points from cards', { exact: true }).fill('-7');
  await expect(page.locator('#total')).toHaveText('116');
});

test('reset confirmation retains language and game settings', async ({ page }) => {
  await page.goto('./');
  await enterRulebook(page);
  await page.getByLabel('Players at the table', { exact: true }).selectOption('2');
  await page.getByLabel('Playing with Turmoil', { exact: true }).check();
  await page.getByRole('button', { name: 'New count', exact: true }).click();
  await page.getByRole('button', { name: 'Keep counting', exact: true }).click();
  await expect(page.locator('#total')).toHaveText('64');
  await page.getByRole('button', { name: 'New count', exact: true }).click();
  await page.getByRole('button', { name: 'Clear score', exact: true }).click();
  await expect(page.locator('#total')).toHaveText('0');
  await expect(page.getByLabel('Players at the table', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Playing with Turmoil', { exact: true })).toBeChecked();
});

test('uses Polish on first visit and fits a 360px screen with enlarged text', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'pl-PL', viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/terraforming-mars-score/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('supports keyboard controls and returns focus after closing the reset dialog', async ({ page }) => {
  await page.goto('./');
  const tr = page.getByLabel('Final terraform rating (TR)', { exact: true });
  await tr.focus();
  await tr.press('ControlOrMeta+A');
  await tr.press('4');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Increase Final terraform rating (TR)', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#total')).toHaveText('5');

  const addCity = page.getByRole('button', { name: 'Add a city', exact: true });
  await addCity.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Greenery adjacent to city 1', { exact: true })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('2');
  await expect(page.locator('#total')).toHaveText('7');

  const noAward = page.getByRole('radio', { name: 'Award 1: None, 0 VP', exact: true });
  await noAward.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Award 1: 1st, 5 VP', exact: true })).toBeChecked();
  await expect(page.locator('#total')).toHaveText('12');

  const reset = page.getByRole('button', { name: 'New count', exact: true });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Keep counting', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(reset).toBeFocused();
  await expect(page.locator('#total')).toHaveText('12');
});

test('reports unavailable local storage without blocking calculation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
  });
  await page.goto('./');
  await expect(page.locator('#save-status')).toContainText('Saving is unavailable');
  await page.getByLabel('Final terraform rating (TR)', { exact: true }).fill('38');
  await expect(page.locator('#total')).toHaveText('38');
  await expect(page.locator('#save-status')).toContainText('Saving is unavailable');
});
