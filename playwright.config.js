const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    expect: { timeout: 5000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['list'],
        ['html', { open: 'never' }]
    ],
    use: {
        baseURL: 'http://127.0.0.1:8765',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        permissions: ['clipboard-read', 'clipboard-write']
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
    ],
    webServer: {
        command: 'node tools/servidor-teste.js 8765',
        url: 'http://127.0.0.1:8765',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    }
});
