const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.SCREENSHOT_API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.SCREENSHOT_EMAIL || 'alex@taskflow.ai';
const PASSWORD = process.env.SCREENSHOT_PASSWORD || 'password123';
const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const outDir = path.join(process.cwd(), 'docs', 'screenshots');
const defaultViewport = { width: 1920, height: 950, deviceScaleFactor: 1 };
const aiViewport = { width: 1440, height: 1160, deviceScaleFactor: 1 };

const waitForApp = async (page) => {
  await page.waitForSelector('#root', { timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, 900));
};

const generateAiPlan = async (page) => {
  await page.waitForSelector('.assistant-panel button[type="submit"]', { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const button = document.querySelector('.assistant-panel button[type="submit"]');
      const projectSelect = document.querySelector('.assistant-panel select');
      return button && !button.disabled && (!projectSelect || projectSelect.value);
    },
    { timeout: 15000 }
  );
  await page.click('.assistant-panel button[type="submit"]');
  await page.waitForSelector('.suggestion-card', { timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, 700));
};

const login = async () => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const capture = async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const auth = await login();
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,950'],
  });

  const page = await browser.newPage();
  await page.setViewport(defaultViewport);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await waitForApp(page);
  await page.screenshot({ path: path.join(outDir, 'login.png'), fullPage: false });

  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, auth.data);

  const shots = [
    ['dashboard.png', '/'],
    ['board.png', '/tasks'],
    ['projects.png', '/projects'],
    ['ai.png', '/ai'],
  ];

  for (const [file, route] of shots) {
    await page.setViewport(file === 'ai.png' ? aiViewport : defaultViewport);
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle0' });
    await waitForApp(page);
    if (file === 'ai.png') {
      await generateAiPlan(page);
    }
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
  }

  await browser.close();
  console.log(`Captured ${shots.length + 1} screenshots in ${outDir}`);
};

capture().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
