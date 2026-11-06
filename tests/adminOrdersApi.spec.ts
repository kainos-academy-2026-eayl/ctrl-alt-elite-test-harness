import { expect, test } from '../fixtures/testFixtures';

const unknownOrderId = '00000000-0000-4000-8000-000000000000';

test('orders and reports reject requests without a valid token', async ({ adminOrdersApi }) => {
    for (const token of [undefined, 'not-a-real-token']) {
        const responses = [
            await adminOrdersApi.listOrders(token),
            await adminOrdersApi.getOrder(unknownOrderId, token),
            await adminOrdersApi.salesReport(token, { from: '2026-11-01', to: '2026-11-05' }),
        ];
        for (const response of responses) {
            expect(response.status()).toBe(401);
            expect(response.headers()['cache-control']).toBe('no-store');
        }
    }
});

test('access to orders and reports depends on the staff role', async ({
    adminOrdersApi,
    customerUser,
    customerServiceUser,
    adminUser,
}) => {
    const range = { from: '2026-11-01', to: '2026-11-05' };
    const customer = await adminOrdersApi.tokenFor(customerUser.email, customerUser.password);
    const service = await adminOrdersApi.tokenFor(customerServiceUser.email, customerServiceUser.password);
    const admin = await adminOrdersApi.tokenFor(adminUser.email, adminUser.password);

    expect((await adminOrdersApi.listOrders(customer)).status()).toBe(403);
    expect((await adminOrdersApi.salesReport(customer, range)).status()).toBe(403);

    expect((await adminOrdersApi.listOrders(service)).status()).toBe(200);
    expect((await adminOrdersApi.salesReport(service, range)).status()).toBe(403);

    expect((await adminOrdersApi.listOrders(admin)).status()).toBe(200);
    const report = await adminOrdersApi.salesReport(admin, range);
    expect(report.status()).toBe(200);
    expect(report.headers()['cache-control']).toBe('no-store');
    expect(Object.keys(await report.json()).sort()).toEqual([
        'dailySales',
        'ordersByStatus',
        'range',
        'summary',
        'topProducts',
    ]);
});

test('the admin order list follows the contract and pages correctly', async ({ adminOrdersApi, adminUser }) => {
    const token = await adminOrdersApi.tokenFor(adminUser.email, adminUser.password);
    const response = await adminOrdersApi.listOrders(token, { pageSize: '2' });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');

    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(2);
    expect(Number.isInteger(body.total)).toBe(true);
    expect(body.totalPages).toBe(Math.ceil(body.total / 2));
    expect(body.orders.length).toBeLessThanOrEqual(2);
    for (const order of body.orders) {
        expect(Object.keys(order).sort()).toEqual([
            'createdAt',
            'customerEmail',
            'customerName',
            'id',
            'itemCount',
            'status',
            'totalPence',
        ]);
        expect(Number.isInteger(order.totalPence)).toBe(true);
        expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);
    }

    // A page past the end is empty but keeps the real totals.
    const pastEnd = await (await adminOrdersApi.listOrders(token, { pageSize: '2', page: '100000' })).json();
    expect(pastEnd.orders).toEqual([]);
    expect(pastEnd.total).toBe(body.total);
    expect(pastEnd.totalPages).toBe(body.totalPages);

    // The detail endpoint exposes the customer without leaking credentials.
    const first = body.orders[0];
    if (first) {
        const detail = await adminOrdersApi.getOrder(first.id, token);
        expect(detail.status()).toBe(200);
        const text = await detail.text();
        expect(text).not.toMatch(/password/i);
        expect((JSON.parse(text) as { order: { id: string } }).order.id).toBe(first.id);
    }
});

test('invalid input is rejected with a message', async ({ adminOrdersApi, adminUser }) => {
    const token = await adminOrdersApi.tokenFor(adminUser.email, adminUser.password);

    const badOrderQueries: Record<string, string>[] = [
        { status: 'BOGUS' },
        { sort: 'sideways' },
        { page: '0' },
        { pageSize: '101' },
        { search: 'a'.repeat(201) },
    ];
    for (const query of badOrderQueries) {
        const response = await adminOrdersApi.listOrders(token, query);
        expect(response.status(), JSON.stringify(query)).toBe(400);
        expect(typeof (await response.json()).message).toBe('string');
    }

    const badReportQueries: Record<string, string>[] = [
        {},
        { from: '2026-11-01' },
        { from: '2026-02-30', to: '2026-03-05' },
        { from: '2026-11-05', to: '2026-11-01' },
        { from: '2024-01-01', to: '2025-01-01' },
    ];
    for (const query of badReportQueries) {
        const response = await adminOrdersApi.salesReport(token, query);
        expect(response.status(), JSON.stringify(query)).toBe(400);
        expect(typeof (await response.json()).message).toBe('string');
    }

    expect((await adminOrdersApi.getOrder('not-a-uuid', token)).status()).toBe(400);
    const missing = await adminOrdersApi.getOrder(unknownOrderId, token);
    expect(missing.status()).toBe(404);
    expect(typeof (await missing.json()).message).toBe('string');
});
