import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LoginAPI } from '../pages/loginApi';

type LoginCredentials = {
    email: string;
    password: string;
};

type LoginFixtures = {
    loginPage: LoginPage;
    loginApi: LoginAPI;
    loginEmail: string;
    loginCredentials: LoginCredentials;
};

export const test = base.extend<LoginFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    loginApi: async ({ request }, use) => {
        await use(new LoginAPI(request));
    },

    loginEmail: async ({ }, use) => {
        const email = process.env.LOGIN_EMAIL;
        if (!email) {
            throw new Error(
                'Set LOGIN_EMAIL to an existing CUSTOMER test account in .env or your environment. See README.md.',
            );
        }
        await use(email);
    },

    loginCredentials: async ({ loginEmail }, use) => {
        const password = process.env.LOGIN_PASSWORD;
        if (!password) {
            throw new Error(
                'Set LOGIN_PASSWORD to the CUSTOMER test account password in .env or your environment. See README.md.',
            );
        }
        await use({ email: loginEmail, password });
    },
});

export { expect } from '@playwright/test';