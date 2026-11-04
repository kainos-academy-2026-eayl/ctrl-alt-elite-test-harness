import { expect, test } from '../fixtures/testFixtures';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
});

test('customer cannot access Inventory Dashboard fail test', async ({ loginPage, page, customerUser }) => {
    await loginPage.loginAs(customerUser.email, customerUser.password);
    await page.goto('/admin/stock/dashboard');
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
    await expect(page.getByText('You do not have permission to view the admin area.')).toBeVisible();
});

test('access Inventory Dashboard as inventory management user', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await expect(page).toHaveURL('http://127.0.0.1:3000/admin/stock/dashboard');
});

test('access Inventory as inventory management user', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await page.getByRole('link', { name: 'Inventory', exact: true }).click();
    await expect(page).toHaveURL('http://127.0.0.1:3000/admin/stock');
});

test('access Inventory  search as inventory management user', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await page.getByRole('link', { name: 'Inventory', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search by name' }).fill('baseball cap');
    await expect(page.getByRole('cell', { name: 'Baseball Cap', exact: true })).toBeVisible();
});
test('access Inventory  and edit product and update stock', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await page.getByRole('link', { name: 'Inventory', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search by name' }).fill('baseball cap');
    await page.getByRole('button', { name: 'Edit stock for Baseball Cap' }).click();
    await page.getByRole('textbox', { name: 'Stock for Baseball Cap' }).fill('10');
    await expect(page).toHaveURL('http://127.0.0.1:3000/admin/stock?q=baseball+cap');
});

test('access Inventory Dashboard as inventory management user and log out', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await expect(page).toHaveURL('http://127.0.0.1:3000/admin/stock/dashboard');
    await page.getByText('R Roisin Conway Inventory').click();
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL('http://127.0.0.1:3000/login');
});

 test('negative stock is not allowed', async ({ loginPage, page, inventoryManagementUser }) => {
    await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
    await page.getByRole('link', { name: 'Inventory', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search by name' }).fill('baseball cap');
    await page.getByRole('button', { name: 'Edit stock for Baseball Cap' }).click();
    await page.getByRole('textbox', { name: 'Stock for Baseball Cap' }).fill('-5');
    await page.getByRole('button', { name: 'Save stock for Baseball Cap' }).click();
    await expect(page.getByText('Enter a whole number from 0 to')).toBeVisible();
    await expect(page).toHaveURL('http://127.0.0.1:3000/admin/stock?q=baseball+cap');
});
