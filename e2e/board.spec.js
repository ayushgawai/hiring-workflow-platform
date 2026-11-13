import { test, expect } from '@playwright/test';
test('stage board moves candidate', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.getByTestId('stage-Applied')).toBeVisible();
  await expect(page.getByTestId('role')).toBeVisible();
});
