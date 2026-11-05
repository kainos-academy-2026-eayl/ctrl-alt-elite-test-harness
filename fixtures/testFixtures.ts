import { test as base } from '@playwright/test';
import { AdminOrdersApi } from '../pages/AdminOrdersApi';
import { AdminPortalPage } from '../pages/AdminPortalPage';
import { LoginPage } from '../pages/LoginPage';
import { LoginAPI } from '../pages/loginApi';

type LoginCredentials = {
    email: string;
    password: string;
};

type LoginFixtures = {
    loginPage: LoginPage;
    loginApi: LoginAPI;
    adminOrdersApi: AdminOrdersApi;
    adminPortal: AdminPortalPage;
    loginEmail: string;
    loginCredentials: LoginCredentials;
    customerUser: LoginCredentials;
    adminUser: LoginCredentials;
    customerServiceUser: LoginCredentials;
    inventoryManagementUser: LoginCredentials;
};

function userCredentials(prefix: string): LoginCredentials {
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];
    if (!email || !password) {
        throw new Error(
            `Set ${prefix}_EMAIL and ${prefix}_PASSWORD to an existing test account in .env or your environment. See README.md.`,
        );
    }
    return { email, password };
}

export const test = base.extend<LoginFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    loginApi: async ({ request }, use) => {
        await use(new LoginAPI(request));
    },

    adminOrdersApi: async ({ request }, use) => {
        await use(new AdminOrdersApi(request));
    },

    adminPortal: async ({ page }, use) => {
        await use(new AdminPortalPage(page));
    },

    loginEmail: async ({ }, use) => {
        const email = process.env.LOGIN_EMAIL;
        if (!email) {
            throw new Error(
                'Set LOGIN_EMAIL to an existing test account in .env or your environment. See README.md.',
            );
        }
        await use(email);
    },

    loginCredentials: async ({ loginEmail }, use) => {
        const password = process.env.LOGIN_PASSWORD;
        if (!password) {
            throw new Error(
                'Set LOGIN_PASSWORD to the test account password in .env or your environment. See README.md.',
            );
        }
        await use({ email: loginEmail, password });
    },

    customerUser: async ({ }, use) => {
        await use(userCredentials('CUSTOMER'));
    },

    adminUser: async ({ }, use) => {
        await use(userCredentials('ADMIN'));
    },

    customerServiceUser: async ({ }, use) => {
        await use(userCredentials('CUSTOMER_SERVICE'));
    },

    inventoryManagementUser: async ({ }, use) => {
        await use(userCredentials('INVENTORY_MANAGEMENT'));
    },
});

export { expect } from '@playwright/test';