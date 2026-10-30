import type { APIRequestContext, APIResponse } from '@playwright/test';

export class LoginAPI {
    readonly request: APIRequestContext;
    readonly endpoint: string;

    constructor(request: APIRequestContext) {
        this.request = request;
        this.endpoint = new URL(
            '/api/auth/login',
            process.env.API_BASE_URL || 'http://127.0.0.1:3001',
        ).toString();
    }

    async login(email: string, password: string): Promise<APIResponse> {
        return this.request.post(this.endpoint, {
            data: { email, password },
        });
    }
}