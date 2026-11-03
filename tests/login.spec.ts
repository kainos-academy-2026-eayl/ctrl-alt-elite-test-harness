import { expect, test } from '../fixtures/testFixtures';

const unknownEmail = 'login-test-user@example.invalid';
const wrongPassword = 'Incorrect-password1!';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test('opens the account dropdown before login', async ({ page, loginPage }) => {
  await page.goto('/');
  await expect(loginPage.accountMenu).toHaveAccessibleName('Account options');
  await loginPage.accountMenu.click();
  await expect(loginPage.loginLink).toBeVisible();
});

test('shows an accessible login form with a masked password', async ({
  page,
  loginPage,
}) => {
  await expect(page).toHaveTitle('Log in | Ctrl-Alt-Elite');
  await expect(loginPage.loginHeading).toBeVisible();
  await expect(loginPage.email).toBeVisible();
  await expect(loginPage.email).toHaveAttribute('type', 'email');
  await expect(loginPage.email).toHaveAttribute('required', '');
  await expect(loginPage.password).toHaveAttribute('type', 'password');
  await expect(loginPage.password).toHaveAttribute('required', '');
  await expect(loginPage.errorMessage).toHaveCount(0);
});

test('shows and hides the password without changing its value or submitting', async ({
  page,
  loginPage,
}) => {
  await loginPage.password.fill(wrongPassword);
  await expect(loginPage.passwordToggle).toHaveAccessibleName('Show password');
  await loginPage.passwordToggle.click();
  await expect(loginPage.password).toHaveAttribute('type', 'text');
  await expect(loginPage.password).toHaveValue(wrongPassword);
  await expect(loginPage.passwordToggle).toHaveAccessibleName('Hide password');
  await loginPage.passwordToggle.click();
  await expect(loginPage.password).toHaveAttribute('type', 'password');
  await expect(loginPage.password).toHaveValue(wrongPassword);
  await expect(page).toHaveURL('/login');
  await expect(loginPage.errorMessage).toHaveCount(0);
});

for (const scenario of [
  {
    name: 'both fields are empty',
    email: '',
    password: '',
    field: 'Email address',
    validity: 'valueMissing',
  },
  {
    name: 'the email is missing',
    email: '',
    password: wrongPassword,
    field: 'Email address',
    validity: 'valueMissing',
  },
  {
    name: 'the password is missing',
    email: unknownEmail,
    password: '',
    field: 'Password',
    validity: 'valueMissing',
  },
  {
    name: 'the email format is invalid',
    email: 'not-an-email',
    password: wrongPassword,
    field: 'Email address',
    validity: 'typeMismatch',
  },
] as const) {
  test(`prevents submission when ${scenario.name}`, async ({ page, loginPage }) => {
    let submissions = 0;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/login'
      ) {
        submissions += 1;
      }
    });
    await loginPage.loginAs(scenario.email, scenario.password);
    const invalidField = page.getByLabel(scenario.field, { exact: true });
    expect(
      await invalidField.evaluate(
        (input: HTMLInputElement, validity) => input.validity[validity],
        scenario.validity,
      ),
    ).toBe(true);
    await expect(invalidField).toBeFocused();
    await expect(page).toHaveURL('/login');
    await expect(loginPage.errorMessage).toHaveCount(0);
    expect(submissions).toBe(0);
  });
}

test('redirects an unauthenticated visitor away from their profile', async ({
  page,
  loginPage,
}) => {
  await page.goto('/profile');
  await expect(page).toHaveURL('/login');
  await expect(loginPage.loginHeading).toBeVisible();
});

test('unregistered user cannot sign in', async ({
  page,
  loginPage,
}) => {
  await loginPage.loginAs(unknownEmail, wrongPassword);
  await expect(page).toHaveURL('/login');
  await expect(loginPage.errorMessage).toHaveText('Incorrect email or password.');
  await expect(loginPage.email).toHaveValue(unknownEmail);
  await expect(loginPage.password).toBeEmpty();
  await page.goto('/profile');
  await expect(page).toHaveURL('/login');
  await expect(loginPage.loginHeading).toBeVisible();
});

test('registered user with an invalid password cannot sign in', async ({
  page,
  loginPage,
  loginEmail,
}) => {
  await loginPage.loginAs(loginEmail, wrongPassword);
  await expect(page).toHaveURL('/login');
  await expect(loginPage.errorMessage).toHaveText('Incorrect email or password.');
  await expect(loginPage.email).toHaveValue(loginEmail);
  await expect(loginPage.password).toBeEmpty();
  await page.goto('/profile');
  await expect(page).toHaveURL('/login');
  await expect(loginPage.loginHeading).toBeVisible();
});

test('customer can sign in', async ({ page, loginPage, customerUser }) => {
  await loginPage.loginAs(customerUser.email, customerUser.password);
  await expect(page).toHaveURL('/');
  await expect(loginPage.message).toBeVisible();
});

test('admin can sign in', async ({ page, loginPage, adminUser }) => {
  await loginPage.loginAs(adminUser.email, adminUser.password);
  await expect(page).not.toHaveURL('/login');
  await page.goto('/profile');
  await expect(page).toHaveURL('/profile');
  await expect(loginPage.profileHeading).toBeVisible();
});

test('customer service can sign in', async ({ page, loginPage, customerServiceUser }) => {
  await loginPage.loginAs(customerServiceUser.email, customerServiceUser.password);
  await expect(page).not.toHaveURL('/login');
  await page.goto('/profile');
  await expect(page).toHaveURL('/profile');
  await expect(loginPage.profileHeading).toBeVisible();
});

test('inventory management can sign in', async ({
  page,
  loginPage,
  inventoryManagementUser,
}) => {
  await loginPage.loginAs(inventoryManagementUser.email, inventoryManagementUser.password);
  await expect(page).not.toHaveURL('/login');
  await page.goto('/profile');
  await expect(page).toHaveURL('/profile');
  await expect(loginPage.profileHeading).toBeVisible();
});

