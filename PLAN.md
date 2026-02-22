# PeakForge — Spectroscopy Peak Fitting

## Mission
Fill the void left by defunct PeakForge software — free web-based peak deconvolution for Raman/FTIR/XPS.

## Architecture
- `packages/engine/` — Baseline correction, peak detection, Gaussian/Lorentzian/Voigt fitting (L-M optimizer)
- `packages/web/` — React + Vite, interactive spectrum chart with peak overlays
- `packages/cli/` — Node runner for batch fitting

## MVP Features (Free Tier)
1. Upload spectrum as CSV (wavenumber/wavelength vs intensity)
2. Auto-detect peaks above noise threshold
3. Fit each peak with Gaussian, Lorentzian, or Voigt profile
4. Automatic baseline correction (linear or polynomial)
5. Output peak positions, heights, areas, and FWHM
6. Overlay raw spectrum + fitted envelope + individual peaks
7. Export fit results as CSV + chart as PNG

## Engine Tasks

### E1: Spectrum Parser
- Parse CSV: column 1 = x (wavenumber/wavelength), column 2 = intensity
- Handle tab/comma/semicolon delimiters
- Sort by x, validate numeric data
- **Validation**: Known spectrum fixtures

### E2: Baseline Correction
- Linear: fit line through user-selected or auto-detected baseline points
- Polynomial: degree 2-5 polynomial fit to baseline regions
- Subtract baseline from spectrum
- **Validation**: Synthetic spectrum with known baseline

### E3: Peak Detection
- Find local maxima above noise threshold
- Noise estimation: median absolute deviation (MAD) of residuals
- Prominence-based filtering to avoid noise peaks
- Output: estimated peak positions, heights, widths
- **Validation**: Synthetic spectrum with known peak positions

### E4: Peak Profile Functions
- Gaussian: `G(x) = H × exp(-4ln2 × ((x-x₀)/FWHM)²)`
- Lorentzian: `L(x) = H × FWHM² / (4(x-x₀)² + FWHM²)`
- Voigt: convolution of Gaussian and Lorentzian (pseudo-Voigt approximation)
  - `V(x) = η × L(x) + (1-η) × G(x)` where η ∈ [0,1]
- **Validation**: Verify peak area = H × FWHM × √(π/4ln2) for Gaussian

### E5: Multi-Peak Fitting (Levenberg-Marquardt)
- Simultaneous fit of N peaks to the spectrum
- Parameters per peak: position x₀, height H, FWHM, (Voigt: η)
- Initial guesses from peak detection
- Convergence criteria: relative change < 1e-6
- Output: fitted parameters, R², residuals
- **Validation**: Synthetic multi-peak spectrum with known parameters

### E6: Peak Metrics & Export
- Per peak: position, height, FWHM, area, shape factor
- Total fitted envelope = sum of all peaks
- Residual = raw - envelope
- CSV export of all metrics + fitted curve data

## Web UI Tasks

### W1: Spectrum Upload & Display
- CSV upload or paste
- Recharts/D3 chart: x vs intensity
- Zoom/pan on spectrum

### W2: Baseline Editor
- Toggle baseline correction on/off
- Select correction type (linear/polynomial)
- Visual baseline overlay on spectrum

### W3: Peak Markers & Fitting
- Auto-detect button → mark peaks with draggable vertical lines
- Manual peak addition (click on spectrum)
- Fit button → overlay fitted peaks (color-coded) + envelope
- Residual plot below main spectrum

### W4: Results Panel
- Table: Peak#, Position, Height, FWHM, Area, Shape
- R² and fit quality indicator
- Click peak in table → highlight on chart

### W5: Export
- Download CSV (peak parameters + fitted curve)
- Download chart as PNG/SVG
- Print-friendly report

### W6: Toolbar & Theme
- Upload, Baseline, Detect, Fit, Export buttons
- Peak profile selector (Gaussian/Lorentzian/Voigt)
- Light/dark theme

## Key Equations
- Gaussian: `G = H × exp(-4ln2 × ((x-x₀)/w)²)`, Area = `H × w × √(π/(4ln2))`
- Lorentzian: `L = H × w² / (4(x-x₀)² + w²)`, Area = `H × w × π/2`
- Pseudo-Voigt: `V = η×L + (1-η)×G`
- L-M update: `Δp = (JᵀJ + λI)⁻¹ Jᵀr`

## Validation Strategy
- Synthetic spectra with known peak parameters (exact match expected)
- Published NIST Raman spectra with known peak positions
- Compare to OriginPro peak fitting on same real data
