import type { Locator, Page } from '@playwright/test';

export class AdminPortalPage {
    readonly navigation: Locator;
    readonly ordersHeading: Locator;
    readonly totalOrders: Locator;
    readonly orderSearch: Locator;
    readonly orderStatus: Locator;
    readonly applyButton: Locator;
    readonly orderStatusCells: Locator;
    readonly noOrdersHeading: Locator;
    readonly clearFiltersLink: Locator;
    readonly reportsHeading: Locator;
    readonly reportFrom: Locator;
    readonly reportTo: Locator;
    readonly runReportButton: Locator;
    readonly dashboardOrdersCard: Locator;
    readonly accessDeniedHeading: Locator;

    constructor(private readonly page: Page) {
        this.navigation = page.getByRole('navigation', { name: 'Admin navigation' });
        this.ordersHeading = page.getByRole('heading', { name: 'Orders', exact: true, level: 1 });
        this.totalOrders = page.locator('[data-total-orders]');
        this.orderSearch = page.getByRole('searchbox', {
            name: 'Search by customer or order reference',
        });
        this.orderStatus = page.locator('#order-status');
        this.applyButton = page.getByRole('button', { name: 'Apply', exact: true });
        this.orderStatusCells = page.locator('td[data-label="Status"]');
        this.noOrdersHeading = page.getByRole('heading', { name: 'No orders found' });
        this.clearFiltersLink = page.getByRole('link', { name: 'Clear filters' });
        this.reportsHeading = page.getByRole('heading', { name: 'Reports', exact: true, level: 1 });
        this.reportFrom = page.getByLabel('From', { exact: true });
        this.reportTo = page.getByLabel('To', { exact: true });
        this.runReportButton = page.getByRole('button', { name: 'Run report' });
        this.dashboardOrdersCard = page.locator('[data-summary-card="Orders"]');
        this.accessDeniedHeading = page.getByRole('heading', { name: 'Access denied' });
    }

    async gotoOrders() {
        await this.page.goto('/admin/orders');
    }

    async gotoReports() {
        await this.page.goto('/admin/reports');
    }

    async gotoDashboard() {
        await this.page.goto('/admin');
    }

    /** The total is only shown once the orders request has finished. */
    async waitForOrdersLoaded() {
        await this.totalOrders.waitFor({ state: 'visible' });
    }
}
