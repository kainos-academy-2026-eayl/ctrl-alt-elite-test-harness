import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/testFixtures';

// The customer site navigation shown in the header of every storefront page.
const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' });

async function openCategories(page: Page) {
    await mainNav(page).getByText('Categories', { exact: true }).click();
}

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('shows Home, Shop, search, account menu and basket in the header', async ({ page }) => {
    const nav = mainNav(page);
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();
    await expect(nav.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
    await expect(nav.getByLabel('Account options')).toBeVisible();
    await expect(page.getByRole('link', { name: /^Basket, \d+ items?$/ })).toBeVisible();
});

test('Shop link opens the product catalogue', async ({ page }) => {
    await mainNav(page).getByRole('link', { name: 'Shop', exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible();
});

test('Categories dropdown lists All products and the product categories', async ({ page }) => {
    await openCategories(page);
    const nav = mainNav(page);
    await expect(nav.getByRole('link', { name: 'All products', exact: true })).toBeVisible();
    await expect(nav.locator('a[href^="/products?category="]').first()).toBeVisible();
});

test('choosing a category filters the catalogue to that category', async ({ page }) => {
    await openCategories(page);
    const category = mainNav(page).locator('a[href^="/products?category="]').first();
    const name = (await category.textContent())?.trim() ?? '';
    await category.click();
    await expect(page).toHaveURL(/\/products\?category=/);
    await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
    for (const label of await page.locator('.product-category').allTextContents()) {
        expect(label.trim()).toBe(name);
    }
});

test('marks the current page in the navigation', async ({ page }) => {
    const nav = mainNav(page);
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Shop', exact: true })).not.toHaveAttribute('aria-current', 'page');

    await nav.getByRole('link', { name: 'Shop', exact: true }).click();
    await expect(nav.getByRole('link', { name: 'Shop', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).not.toHaveAttribute('aria-current', 'page');
});

test('searching from the header shows search results', async ({ page }) => {
    await page.goto('/basket');
    const search = mainNav(page).getByRole('searchbox', { name: 'Search products' });
    await search.fill('shirt');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=shirt$/);
    await expect(page.getByRole('heading', { name: 'Search results' })).toBeVisible();
});

test('guest account menu offers Login, Register and Support', async ({ page }) => {
    const nav = mainNav(page);
    await nav.getByLabel('Account options').click();
    await expect(nav.getByRole('link', { name: 'Register', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Support', exact: true })).toBeVisible();
    await nav.getByRole('link', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Log in', exact: true })).toBeVisible();
});

test('basket link opens the basket from every storefront page', async ({ page }) => {
    for (const path of ['/', '/products', '/login']) {
        await page.goto(path);
        await page.getByRole('link', { name: /^Basket, \d+ items?$/ }).click();
        await expect(page).toHaveURL(/\/basket$/);
        await expect(page.getByRole('heading', { name: 'Your basket' })).toBeVisible();
    }
});

test.describe('on a phone-sized screen', () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test('the links are hidden until the menu button is used', async ({ page }) => {
        const shop = mainNav(page).getByRole('link', { name: 'Shop', exact: true });
        await expect(shop).toBeHidden();

        const menuButton = page.locator('label.site-nav-toggle');
        await menuButton.click();
        await expect(shop).toBeVisible();
        await expect(mainNav(page).getByRole('searchbox', { name: 'Search products' })).toBeVisible();

        await menuButton.click();
        await expect(shop).toBeHidden();
    });
});

test('staff dashboards keep their own navigation, not the customer one', async ({ loginPage, page, adminUser }) => {
    await loginPage.goto();
    await loginPage.loginAs(adminUser.email, adminUser.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('navigation', { name: 'Admin navigation' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toHaveCount(0);
});