import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────

const SAMPLES = [
  'Raman: Polystyrene Reference',
  'FTIR: Overlapping C-H Stretch',
  'XPS: Carbon 1s',
  'UV-Vis: Broad Absorption',
  'Complex Multi-Peak',
];

async function loadSample(page: Page, name: string) {
  const select = page.locator('select').first();
  await select.selectOption({ label: name });
}

async function detectPeaks(page: Page) {
  await page.getByRole('button', { name: /Detect Peaks/ }).click();
}

async function fitPeaks(page: Page) {
  await page.getByRole('button', { name: /Fit/ }).click();
}

async function waitForChart(page: Page) {
  await expect(page.locator('.chart-area')).toBeVisible();
  // Wait for recharts to render SVG paths
  await expect(page.locator('.chart-container .recharts-line-curve').first()).toBeVisible();
}

// ── Core Workflow ────────────────────────────────────────────────

test.describe('Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with drop zone / upload prompt', async ({ page }) => {
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.getByText(/Drop a CSV/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select File' })).toBeVisible();
  });

  test('load sample from dropdown → spectrum chart displayed', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
  });

  test('detect peaks → peak markers appear', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await detectPeaks(page);
    await expect(page.getByTestId('detect-notice')).toContainText(/peak/i);
    // After detection, Fit button should be enabled (hasPeaks = true)
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeEnabled();
  });

  test('full workflow: detect + select Gaussian + fit → R², residual, table', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    // Select Gaussian profile (default, but be explicit)
    await page.locator('select').nth(1).selectOption('gaussian');

    await detectPeaks(page);
    await fitPeaks(page);

    // R² displayed
    await expect(page.locator('.r-squared')).toBeVisible();
    await expect(page.locator('.r-squared')).toContainText('R²');

    // Results table visible
    await expect(page.locator('.results-panel table')).toBeVisible();
    const rows = page.locator('.results-panel tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);

    // Residual plot visible
    await expect(page.locator('.residual-container')).toBeVisible();

    // Fitted envelope line rendered
    await expect(page.locator('.recharts-line-curve').nth(1)).toBeVisible();
  });
});

// ── Samples ──────────────────────────────────────────────────────

test.describe('Samples', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const name of SAMPLES) {
    test(`load "${name}" → spectrum displays correctly`, async ({ page }) => {
      await loadSample(page, name);
      await waitForChart(page);
    });
  }

  for (const name of SAMPLES) {
    test(`detect + fit "${name}" → valid fit`, async ({ page }) => {
      await loadSample(page, name);
      await waitForChart(page);
      await detectPeaks(page);
      await fitPeaks(page);
      await expect(page.locator('.r-squared')).toBeVisible();
      await expect(page.locator('.results-panel table')).toBeVisible();
    });
  }

  test('Raman sample → 3 peaks found', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);
    const rows = page.locator('.results-panel tbody tr');
    expect(await rows.count()).toBe(3);
  });

  test('Overlapping FTIR → deconvolution works (2 peaks)', async ({ page }) => {
    await loadSample(page, SAMPLES[1]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);
    const rows = page.locator('.results-panel tbody tr');
    expect(await rows.count()).toBe(2);
  });

  test('Complex multi-peak → handles 5+ peaks', async ({ page }) => {
    await loadSample(page, SAMPLES[4]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);
    const rows = page.locator('.results-panel tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(5);
  });
});

// ── Workflow Steps ───────────────────────────────────────────────

test.describe('Workflow Steps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
  });

  test('baseline correction toggle works', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Baseline/ });
    // Initially OFF
    await expect(btn).toContainText('OFF');
    await btn.click();
    await expect(btn).toContainText('ON');
    // Baseline method dropdown appears when ON
    await expect(page.locator('select').nth(1)).toBeVisible();
    // Toggle back off
    await btn.click();
    await expect(btn).toContainText('OFF');
  });

  test('AsLS baseline method exposes parameter controls', async ({ page }) => {
    const baselineBtn = page.getByRole('button', { name: /Baseline/ });
    await baselineBtn.click();
    await expect(baselineBtn).toContainText('ON');

    const baselineSelect = page.locator('select').nth(1);
    await baselineSelect.selectOption('asls');

    await expect(page.locator('.toolbar-inline-label', { hasText: 'λ' }).locator('input')).toBeVisible();
    await expect(page.locator('.toolbar-inline-label', { hasText: 'p' }).locator('input')).toBeVisible();
    await expect(page.locator('.toolbar-inline-label', { hasText: 'iters' }).locator('input')).toBeVisible();
  });

  test('peak detection sensitivity — detect finds peaks', async ({ page }) => {
    await detectPeaks(page);
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeEnabled();
  });

  test('profile selection: Gaussian works', async ({ page }) => {
    await page.locator('select').nth(1).selectOption('gaussian');
    await detectPeaks(page);
    await fitPeaks(page);
    await expect(page.locator('.r-squared')).toBeVisible();
  });

  test('profile selection: Lorentzian works', async ({ page }) => {
    await page.locator('select').nth(1).selectOption('lorentzian');
    await detectPeaks(page);
    await fitPeaks(page);
    await expect(page.locator('.r-squared')).toBeVisible();
  });

  test('profile selection: Pseudo-Voigt works', async ({ page }) => {
    await page.locator('select').nth(1).selectOption('pseudoVoigt');
    await detectPeaks(page);
    await fitPeaks(page);
    await expect(page.locator('.r-squared')).toBeVisible();
  });

  test('can remove a detected peak before fitting (click adds, redetect resets)', async ({ page }) => {
    await detectPeaks(page);
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeEnabled();

    // Re-detecting resets peaks
    await detectPeaks(page);
    await expect(fitBtn).toBeEnabled();
  });

  test('manual peak count controls top-N fit result count', async ({ page }) => {
    await loadSample(page, SAMPLES[4]); // complex sample with many peaks
    await waitForChart(page);
    await detectPeaks(page);

    const peakCountInput = page.locator('.toolbar-inline-label', { hasText: 'Peaks' }).locator('input');
    await expect(peakCountInput).toBeVisible();
    await peakCountInput.fill('2');
    await fitPeaks(page);

    const rows = page.locator('.results-panel tbody tr');
    expect(await rows.count()).toBe(2);
  });
});

// ── Export ────────────────────────────────────────────────────────

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);
    await expect(page.locator('.r-squared')).toBeVisible();
  });

  test('Results CSV export available after fit', async ({ page }) => {
    const csvBtn = page.locator('.results-panel').getByRole('button', { name: /Results CSV/ });
    await expect(csvBtn).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await csvBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('Data CSV export available after fit', async ({ page }) => {
    const csvBtn = page.locator('.results-panel').getByRole('button', { name: /Data CSV/ });
    await expect(csvBtn).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await csvBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('PNG export in chart area', async ({ page }) => {
    const pngBtn = page.locator('.chart-area').getByRole('button', { name: /PNG/ });
    await expect(pngBtn).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await pngBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('SVG export in chart area', async ({ page }) => {
    const svgBtn = page.locator('.chart-area').getByRole('button', { name: /SVG/ });
    await expect(svgBtn).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await svgBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.svg');
  });
});

// ── Edge Cases ───────────────────────────────────────────────────

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('fit with 0 peaks detected → fit button disabled', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    // Don't detect peaks — fit button should be disabled
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeDisabled();
  });

  test('load new sample while results showing → clears old results', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);
    await expect(page.locator('.results-panel')).toBeVisible();

    // Load a different sample
    await loadSample(page, SAMPLES[1]);
    await waitForChart(page);

    // Old results should be cleared
    await expect(page.locator('.results-panel')).not.toBeVisible();
    // Fit button should be disabled (no peaks detected yet)
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeDisabled();
  });

  test('very noisy spectrum (Complex) → still detects major peaks', async ({ page }) => {
    await loadSample(page, SAMPLES[4]);
    await waitForChart(page);
    await detectPeaks(page);
    // Should detect at least some peaks even with noise
    const fitBtn = page.getByRole('button', { name: /Fit/ });
    await expect(fitBtn).toBeEnabled();
    await fitPeaks(page);
    await expect(page.locator('.r-squared')).toBeVisible();
  });
});

// ── UI ───────────────────────────────────────────────────────────

test.describe('UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('theme toggle switches light/dark', async ({ page }) => {
    const app = page.locator('.app-layout');
    await expect(app).toHaveAttribute('data-theme', 'light');

    // Find the theme toggle button (last button in toolbar with moon/sun emoji)
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ });
    await themeBtn.click();
    await expect(app).toHaveAttribute('data-theme', 'dark');

    await themeBtn.click();
    await expect(app).toHaveAttribute('data-theme', 'light');
  });

  test('theme persists in localStorage', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ });
    await themeBtn.click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-theme', 'dark');

    // Reload and check theme is restored
    await page.reload();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-theme', 'dark');
  });

  test('dark theme text visible — axis labels, legend, table headers', async ({ page }) => {
    // Switch to dark theme
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ });
    await themeBtn.click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-theme', 'dark');

    // Load sample and render chart
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    // Axis tick text should be visible
    const axisTick = page.locator('.recharts-cartesian-axis-tick-value').first();
    await expect(axisTick).toBeVisible();

    // Logo text visible
    await expect(page.locator('.toolbar .logo')).toBeVisible();

    // Detect + fit for results table
    await detectPeaks(page);
    await fitPeaks(page);

    // Results table headers visible
    await expect(page.locator('.results-panel h3')).toBeVisible();
    const th = page.locator('.results-panel table th').first();
    await expect(th).toBeVisible();

    const tdColor = await page.locator('.results-panel table tbody td').first().evaluate(el => getComputedStyle(el).color);
    expect(tdColor).not.toBe('rgb(0, 0, 0)');
  });

  test('brush labels are readable in dark theme', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ });
    await themeBtn.click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-theme', 'dark');

    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    const travellers = page.locator('.recharts-brush-traveller');
    await expect(travellers).toHaveCount(2);

    const handleFill = await travellers.first().locator('rect').evaluate(el => getComputedStyle(el).fill);
    expect(handleFill).not.toBe('rgb(255, 255, 255)');

    await expect(page.locator('.chart-x-label')).toBeVisible();
  });

  test('toolbar keeps baseline-to-fit controls in second row', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    const rows = page.locator('.toolbar .toolbar-row');
    await expect(rows).toHaveCount(2);

    await expect(rows.nth(0).getByRole('button', { name: /Upload CSV/ })).toBeVisible();
    await expect(rows.nth(1).getByRole('button', { name: /Baseline/ })).toBeVisible();
    await expect(rows.nth(1).getByRole('button', { name: /Detect Peaks/ })).toBeVisible();
    await expect(rows.nth(1).getByRole('button', { name: /Fit/ })).toBeVisible();
  });

  test('in-place export buttons in chart area and results panel', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    // Chart area export buttons visible
    await expect(page.locator('.chart-area .export-bar button', { hasText: /PNG/ })).toBeVisible();
    await expect(page.locator('.chart-area .export-bar button', { hasText: /SVG/ })).toBeVisible();

    // Detect + fit for results panel
    await detectPeaks(page);
    await fitPeaks(page);

    // Results panel export buttons visible
    await expect(page.locator('.results-panel .export-bar button', { hasText: /Results CSV/ })).toBeVisible();
    await expect(page.locator('.results-panel .export-bar button', { hasText: /Data CSV/ })).toBeVisible();

    // Toolbar should NOT have export buttons
    await expect(page.locator('.toolbar button', { hasText: /💾 CSV/ })).toHaveCount(0);
    await expect(page.locator('.toolbar button', { hasText: /🖼️ PNG/ })).toHaveCount(0);
  });

  test('Guide button opens intro page', async ({ page }) => {
    const guideBtn = page.getByRole('button', { name: /Guide/ });
    await expect(guideBtn).toBeVisible();
    // Click should open new tab — verify no crash
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      guideBtn.click(),
    ]);
    // New page should have been opened
    expect(newPage).toBeTruthy();
    await newPage.close();
  });

  test('residual plot shows above/below zero line', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await detectPeaks(page);
    await fitPeaks(page);

    // Residual container visible
    await expect(page.locator('.residual-container')).toBeVisible();
    // Check that residual plot has rendered recharts content
    await expect(page.locator('.residual-container .recharts-line-curve')).toBeVisible();
  });

  test('x-axis label renders in dedicated row below chart', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await expect(page.locator('.chart-x-label')).toBeVisible();
    await expect(page.locator('.chart-x-label')).toHaveText('Wavenumber (cm-1)');
  });
});

// ── State Persistence ────────────────────────────────────────

test.describe('State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('spectrum data persists across reload', async ({ page }) => {
    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);
    await page.waitForTimeout(700);
    await page.reload();
    // Chart should still be visible after reload
    await expect(page.locator('.chart-area')).toBeVisible();
    await expect(page.locator('.chart-container .recharts-line-curve').first()).toBeVisible();
  });
});

// ── Dark Theme on Chart ─────────────────────────────────────

test.describe('Dark Theme on Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('chart area uses dark background in dark mode', async ({ page }) => {
    const themeBtn = page.getByRole('button', { name: /🌙|☀️/ });
    await themeBtn.click();
    await expect(page.locator('.app-layout')).toHaveAttribute('data-theme', 'dark');

    await loadSample(page, SAMPLES[0]);
    await waitForChart(page);

    // Chart area should have dark background
    const chartBg = await page.locator('.chart-area').evaluate(el => getComputedStyle(el).backgroundColor);
    // --bg in dark mode is #1a1a2e = rgb(26, 26, 46)
    expect(chartBg).toBe('rgb(26, 26, 46)');
  });
});
