import { test, expect } from '@playwright/test';

const DEFAULT_TODOS = [
  'Learn RTK Query',
  'Build a todo app',
  'Drag items to reorder',
  '[FAIL] This update always fails',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for todos to load (mock API has 500ms delay)
  await expect(page.locator('.todo-item')).toHaveCount(DEFAULT_TODOS.length);
});

test('loads default todos', async ({ page }) => {
  for (const title of DEFAULT_TODOS) {
    await expect(page.getByText(title)).toBeVisible();
  }
});

test('creates a new todo', async ({ page }) => {
  const input = page.getByPlaceholder('Enter a new todo...');
  await input.fill('Buy groceries');
  await page.getByRole('button', { name: 'Add Todo' }).click();

  await expect(page.getByText('Buy groceries')).toBeVisible();
  await expect(page.locator('.todo-item')).toHaveCount(DEFAULT_TODOS.length + 1);
});

test('creates todo via Enter key', async ({ page }) => {
  const input = page.getByPlaceholder('Enter a new todo...');
  await input.fill('Press enter todo');
  await input.press('Enter');

  await expect(page.getByText('Press enter todo')).toBeVisible();
});

test('clears input after creating', async ({ page }) => {
  const input = page.getByPlaceholder('Enter a new todo...');
  await input.fill('Temporary text');
  await page.getByRole('button', { name: 'Add Todo' }).click();

  await expect(input).toHaveValue('');
});

test('completes a todo', async ({ page }) => {
  const todoItem = page.locator('.todo-item', { hasText: 'Learn RTK Query' });
  const checkbox = todoItem.locator('input[type="checkbox"]');

  await expect(checkbox).not.toBeChecked();
  await checkbox.check();

  await expect(checkbox).toBeChecked();
  await expect(todoItem.locator('span.completed')).toBeVisible();
});

test('uncompletes a todo', async ({ page }) => {
  // "Build a todo app" starts completed
  const todoItem = page.locator('.todo-item', { hasText: 'Build a todo app' });
  const checkbox = todoItem.locator('input[type="checkbox"]');

  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();

  await expect(checkbox).not.toBeChecked();
  await expect(todoItem.locator('span.completed')).toHaveCount(0);
});

test('deletes a todo', async ({ page }) => {
  const todoItem = page.locator('.todo-item', { hasText: 'Learn RTK Query' });
  await todoItem.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('Learn RTK Query')).toBeHidden();
  await expect(page.locator('.todo-item')).toHaveCount(DEFAULT_TODOS.length - 1);
});

test('deletes all deletable todos', async ({ page }) => {
  const deletable = DEFAULT_TODOS.filter((t) => !t.startsWith('[FAIL]'));
  for (const title of deletable) {
    const item = page.locator('.todo-item', { hasText: title });
    await item.getByRole('button', { name: 'Delete' }).click();
    await expect(item).toBeHidden();
  }

  // [FAIL] item rejects deletes server-side, so it remains
  await expect(page.locator('.todo-item')).toHaveCount(1);
});

test('full lifecycle: create → complete → delete', async ({ page }) => {
  const input = page.getByPlaceholder('Enter a new todo...');
  const todoTitle = 'Lifecycle test todo';

  // Create
  await input.fill(todoTitle);
  await page.getByRole('button', { name: 'Add Todo' }).click();
  const todoItem = page.locator('.todo-item', { hasText: todoTitle });
  await expect(todoItem).toBeVisible();

  // Complete
  const checkbox = todoItem.locator('input[type="checkbox"]');
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(todoItem.locator('span.completed')).toBeVisible();

  // Delete
  await todoItem.getByRole('button', { name: 'Delete' }).click();
  await expect(todoItem).toBeHidden();
});
