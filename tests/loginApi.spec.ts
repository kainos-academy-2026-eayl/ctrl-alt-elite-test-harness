import { expect, test } from '../fixtures/testFixtures';

const unknownEmail = 'login-test-user@example.invalid';
const wrongPassword = 'Incorrect-password1!';

test('registered account receives a login token', async ({
    loginApi,
    loginCredentials,
}) => {
    const response = await loginApi.login(
        loginCredentials.email,
        loginCredentials.password,
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.userId).toBe('string');
    expect(Boolean(body.userId)).toBe(true);
    expect(body.email).toBe(loginCredentials.email.trim().toLowerCase());
    expect(body.role).toBe('CUSTOMER');
    expect(typeof body.token).toBe('string');
    expect(Boolean(body.token)).toBe(true);
    expect(body.password).toBeUndefined();
    expect(body.passwordHash).toBeUndefined();
});

test('registered account with an invalid password receives 401', async ({
    loginApi,
    loginEmail,
}) => {
    const response = await loginApi.login(loginEmail, wrongPassword);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
        message: 'Incorrect email or password.',
    });
});

test('unregistered account receives 401', async ({ loginApi }) => {
    const response = await loginApi.login(unknownEmail, wrongPassword);

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
        message: 'Incorrect email or password.',
    });
});