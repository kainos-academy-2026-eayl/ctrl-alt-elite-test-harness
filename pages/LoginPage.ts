import type { Locator, Page } from '@playwright/test';

export class LoginPage {
    readonly email: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly logoutButton: Locator;
    readonly accountMenu: Locator;
    readonly errorMessage: Locator;
    readonly loginHeading: Locator;
    readonly message: Locator;
    readonly profileHeading: Locator;
    readonly loginLink: Locator;
    readonly profileLink: Locator;
    readonly passwordToggle: Locator;

    constructor(private readonly page: Page) {
        this.email = page.getByLabel('Email address', { exact: true });
        this.password = page.getByLabel('Password', { exact: true });
        this.loginButton = page.getByRole('button', { name: 'Log in', exact: true });
        this.logoutButton = page.getByRole('button', { name: 'Logout', exact: true });
        this.accountMenu = page.getByLabel(/^.+ options$/);
        this.errorMessage = page.getByRole('alert');
        this.loginHeading = page.getByRole('heading', { name: 'Log in', exact: true });
        this.message = page.getByRole('heading', {
            name: 'Find your next favourite.',
            exact: true,
        });
        this.profileHeading = page.getByRole('heading', {
            name: 'My Profile',
            exact: true,
        });
        this.loginLink = page.getByRole('link', { name: 'Login', exact: true });
        this.profileLink = page.getByRole('link', { name: 'My Profile', exact: true });
        this.passwordToggle = page.getByRole('button', {
            name: /^(Show|Hide) password$/,
        });
    }

    async goto() {
        await this.page.goto('/login');
    }

    async loginAs(email: string, password: string) {
        await this.email.fill(email);
        await this.password.fill(password);
        await this.loginButton.click();
    }

    async logout() {
        if (!(await this.logoutButton.isVisible())) {
            await this.accountMenu.click();
        }
        await this.logoutButton.click();
    }
}