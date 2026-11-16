import { test, expect } from '@playwright/test'

test.describe('ApplyLine full user journey', () => {
  const email = `e2e-${Date.now()}@example.com`

  test('register → manage search → logout', async ({ page }) => {
    // 1. Landing page
    await page.goto('/')
    await expect(page.getByText('Your career.').first()).toBeVisible()
    await page.getByRole('link', { name: /Get started/i }).click()

    // 2. Register
    await page.getByLabel('Full name').fill('Jordan Tester')
    await page.getByLabel(/^Email/).fill(email)
    await page.getByLabel(/^Password/).fill('Password123!')
    await page.getByLabel('Confirm').fill('Password123!')
    await page.getByRole('button', { name: /Create account/i }).click()
    await expect(page).toHaveURL(/\/app/)

    const nav = page.getByRole('navigation', { name: 'Main navigation' })

    // 3. Create a company
    await nav.getByRole('link', { name: 'Companies' }).click()
    await page.getByRole('button', { name: /Add company/i }).first().click()
    await page.getByLabel('Company name').fill('Northwind Labs')
    await page.getByLabel('Industry').fill('Technology')
    await page.getByRole('button', { name: /Add company/i }).last().click()
    await expect(page.getByText('Northwind Labs')).toBeVisible()

    // 4. Create an application
    await nav.getByRole('link', { name: 'Applications' }).click()
    await page.getByRole('button', { name: /Add application/i }).first().click()
    await page.getByLabel('Position title').fill('Frontend Engineer')
    const companySelect = page.getByLabel('Company', { exact: true })
    await expect(companySelect.locator('option', { hasText: 'Northwind Labs' })).toBeAttached()
    await companySelect.selectOption({ label: 'Northwind Labs' })
    await page.getByRole('button', { name: /Add application/i }).last().click()
    await expect(page.getByText('Frontend Engineer')).toBeVisible()

    // 5. Change its status via the detail dialog
    await page.getByText('Frontend Engineer').click()
    await page.getByRole('button', { name: 'Applied', exact: true }).click()
    await expect(page.getByText('Status updated.')).toBeVisible()
    await page.getByRole('button', { name: 'Done' }).click()

    // 6. Dashboard shows real data
    await nav.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page.getByText('Applications over time')).toBeVisible()
    await expect(page.getByText('Frontend Engineer').first()).toBeVisible()

    // 7. Schedule an interview
    await nav.getByRole('link', { name: 'Interviews' }).click()
    await page.getByRole('button', { name: /Schedule interview/i }).first().click()
    await page.getByLabel('Title').fill('Intro call')
    await page.getByRole('button', { name: /^Schedule$/ }).click()
    await expect(page.getByText('Intro call')).toBeVisible()

    // 8. Create a reminder
    await nav.getByRole('link', { name: 'Reminders' }).click()
    await page.getByRole('button', { name: /New reminder/i }).first().click()
    await page.getByLabel('Title').fill('Send thank-you note')
    await page.getByRole('button', { name: /Create reminder/i }).click()
    await expect(page.getByText('Send thank-you note')).toBeVisible()

    // 9. Upload and download a document
    await nav.getByRole('link', { name: 'Documents' }).click()
    await page.getByRole('button', { name: /Upload document/i }).click()
    await page.locator('input[type=file]').setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('My resume text'),
    })
    await page.getByRole('button', { name: /^Upload$/ }).click()
    await expect(page.getByText('resume.txt')).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Download/ }).first().click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('resume.txt')

    // 10. Log out
    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: /Log out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
