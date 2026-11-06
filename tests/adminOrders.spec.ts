import { expect, test } from '../fixtures/testFixtures';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
});

test('admin sees the orders page with a total', async ({ loginPage, page, adminPortal, adminUser }) => {
    await loginPage.loginAs(adminUser.email, adminUser.password);
    await page.waitForURL(/\/admin/);
    await adminPortal.gotoOrders();
    await expect(adminPortal.ordersHeading).toBeVisible();
    await expect(adminPortal.totalOrders).toHaveText(/^Total Orders: \d+$/);
});

test('admin can filter orders by status', async ({ loginPage, page, adminPortal, adminUser }) => {
    await loginPage.loginAs(adminUser.email, adminUser.password);
    await page.waitForURL(/\/admin/);
    await adminPortal.gotoOrders();
    await adminPortal.waitForOrdersLoaded();

    await adminPortal.orderStatus.selectOption({ label: 'Cancelled' });
    await adminPortal.applyButton.click();
    await expect(page).toHaveURL(/\/admin\/orders\?.*status=CANCELLED/);
    await adminPortal.waitForOrdersLoaded();

    // There may be no cancelled orders, but any that are listed must match.
    for (const status of await adminPortal.orderStatusCells.allInnerTexts()) {
        expect(status).toContain('Cancelled');
    }
});

test('admin sees an empty state when no orders match a search', async ({ loginPage, page, adminPortal, adminUser }) => {
    await loginPage.loginAs(adminUser.email, adminUser.password);
    await page.waitForURL(/\/admin/);
    await adminPortal.gotoOrders();
    await adminPortal.waitForOrdersLoaded();

    await adminPortal.orderSearch.fill('zzz-no-such-customer-zzz');
    await adminPortal.applyButton.click();
    await expect(adminPortal.noOrdersHeading).toBeVisible();
    await expect(page.getByText('No orders match your filters.')).toBeVisible();

    await adminPortal.clearFiltersLink.click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(adminPortal.orderSearch).toHaveValue('');
});

test('admin can run a sales report for a date range', async ({ loginPage, page, adminPortal, adminUser }) => {
    await loginPage.loginAs(adminUser.email, adminUser.password);
    await page.waitForURL(/\/admin/);
    await adminPortal.gotoReports();
    await expect(adminPortal.reportsHeading).toBeVisible();

    await adminPortal.reportFrom.fill('2026-01-01');
    await adminPortal.reportTo.fill('2026-01-31');
    await adminPortal.runReportButton.click();

    await expect(page).toHaveURL(/from=2026-01-01&to=2026-01-31/);
    await expect(page.getByText('Total revenue', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Orders by status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top products' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Daily sales' })).toBeVisible();
});

test('customer service can use orders but not reports', async ({
    loginPage,
    page,
    adminPortal,
    customerServiceUser,
}) => {
    await loginPage.loginAs(customerServiceUser.email, customerServiceUser.password);
    await page.waitForURL(/\/admin/);
    await expect(adminPortal.navigation.getByRole('link', { name: 'Orders', exact: true })).toBeVisible();
    await expect(adminPortal.navigation.getByRole('link', { name: 'Reports', exact: true })).toHaveCount(0);

    await adminPortal.gotoOrders();
    await expect(adminPortal.ordersHeading).toBeVisible();
    await expect(adminPortal.totalOrders).toHaveText(/^Total Orders: \d+$/);

    await adminPortal.gotoReports();
    await expect(adminPortal.accessDeniedHeading).toBeVisible();
});

test('the dashboard Orders card shows the live order total', async ({
    loginPage,
    page,
    adminPortal,
    adminOrdersApi,
    adminUser,
}) => {
    const token = await adminOrdersApi.tokenFor(adminUser.email, adminUser.password);
    const { total } = await (await adminOrdersApi.listOrders(token, { pageSize: '1' })).json();

    await loginPage.loginAs(adminUser.email, adminUser.password);
    await page.waitForURL(/\/admin/);
    await adminPortal.gotoDashboard();
    await expect(adminPortal.dashboardOrdersCard).toHaveText(String(total));
});
