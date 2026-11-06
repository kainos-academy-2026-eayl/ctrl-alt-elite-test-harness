import type { APIRequestContext, APIResponse } from '@playwright/test';
import { LoginAPI } from './loginApi';

type Query = Record<string, string>;

export class AdminOrdersApi {
    readonly baseUrl: string;

    constructor(private readonly request: APIRequestContext) {
        this.baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
    }

    /** Logs in through the real login API and returns the bearer token. */
    async tokenFor(email: string, password: string): Promise<string> {
        const response = await new LoginAPI(this.request).login(email, password);
        if (!response.ok()) {
            throw new Error(`Login failed with status ${response.status()}.`);
        }
        const { token } = (await response.json()) as { token?: string };
        if (!token) {
            throw new Error('The login response did not include a token.');
        }
        return token;
    }

    get(path: string, token?: string, query: Query = {}): Promise<APIResponse> {
        const url = new URL(path, this.baseUrl);
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.set(key, value);
        }
        return this.request.get(url.toString(), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    }

    listOrders(token?: string, query: Query = {}): Promise<APIResponse> {
        return this.get('/api/admin/orders', token, query);
    }

    getOrder(id: string, token?: string): Promise<APIResponse> {
        return this.get(`/api/admin/orders/${id}`, token);
    }

    salesReport(token?: string, query: Query = {}): Promise<APIResponse> {
        return this.get('/api/admin/reports/sales', token, query);
    }
}
