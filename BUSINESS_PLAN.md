# PeakForge — Business Plan

## 1. Executive Summary

PeakForge is a free, browser-based spectroscopy peak fitting tool targeting researchers and analysts who currently pay $1,000–$5,000/yr for desktop software (OriginPro, GRAMS/AI) or struggle with the steep learning curve of open-source alternatives (Fityk). PeakForge delivers multi-peak Gaussian/Lorentzian/Voigt deconvolution, residual analysis, and publication-quality output — all running client-side with zero installation.

**Market opportunity:** Every Raman, FTIR, XPS, and NMR lab needs peak fitting. Academic labs are price-sensitive; industrial labs value speed and compliance. The free tier builds a user base; premium features (batch processing, spectral database matching, advanced baselines) convert power users at $149–$599/yr.

**Current state:** 72 tests (56 unit + 16 E2E), 3 profile types, Levenberg-Marquardt optimizer, interactive spectrum viewer with peak overlays and residual plot. Deployed at PeakForge.app via Vercel.

---

## 2. Current Assessment

### Confidence Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| Professional Use | 70% | Core fitting engine is solid; needs advanced baselines for XPS users |
| Scales to Real Data | 50% | Works for clean spectra; struggles with noisy data and >5 peaks |
| Useful Today | 80% | Researchers can upload, fit, and export — covers basic workflow |
| Incremental Premium | 60% | Polynomial baselines and batch mode are clear upsells |
| Major Premium | 75% | Database matching and 2D correlation are high-value differentiators |

### Test Coverage
- **Unit tests:** 56 (engine: parser, baseline, peak detection, profiles, L-M fitter, metrics)
- **E2E tests:** 16 (upload → detect → fit → export workflow)
- **Profile types:** Gaussian, Lorentzian, pseudo-Voigt
- **Optimizer:** Levenberg-Marquardt with convergence at Δ < 1e-6

### Current Limitations
- Linear baseline only (no polynomial, Shirley, or Tougaard)
- ~5 peak practical limit before optimizer convergence issues
- No batch processing for multiple spectra
- No spectral database matching (RRUFF, NIST)
- Symmetric peak shapes only

---

## 3. Competitive Landscape

| Feature | PeakForge (Free) | OriginPro (~$1,099/yr) | Fityk (Free/OSS) | GRAMS/AI (~$5,000) |
|---------|---------------|----------------------|------------------|-------------------|
| Price | **$0** | $1,099/yr academic, $2,500+ commercial | Free | ~$5,000 license |
| Platform | **Browser** | Windows desktop | Desktop (Win/Mac/Linux) | Windows desktop |
| Installation | **None** | Heavy installer | Install required | Heavy installer + dongle |
| Peak profiles | G/L/Voigt | G/L/Voigt + custom | G/L/Voigt + custom | G/L/Voigt + custom |
| Baseline types | Linear | Polynomial, Shirley, spline | Polynomial, spline | Polynomial, Shirley, Tougaard |
| Batch processing | ❌ | ✅ | ✅ (scripting) | ✅ |
| Database matching | ❌ | ❌ | ❌ | ✅ (RRUFF/NIST) |
| Residual plot | ✅ | ✅ | ✅ | ✅ |
| Export quality | PNG/CSV | Publication (EPS/PDF) | PNG/CSV | Proprietary + export |
| Multi-peak limit | ~5 | Unlimited | Unlimited | Unlimited |
| Learning curve | **Low** | High | Medium-High | High |
| Collaboration | **Link sharing** | File-based | File-based | File-based |

### Competitive Advantages
1. **Zero friction** — no install, no license, works on any device
2. **Modern UX** — interactive spectrum with drag-to-fit peaks, real-time residuals
3. **Transparent math** — open-source engine, reproducible results
4. **Publication-ready** — SVG/PNG export with proper axis labels and legends

### Competitive Gaps to Close
1. Baseline variety (Shirley for XPS is table-stakes)
2. Batch processing (lab users often have 50+ spectra per experiment)
3. Peak count scalability (real Raman spectra can have 20+ peaks)
4. Custom peak model definitions

---

## 4. Free Tier (Current + Near-term)

The free tier must be genuinely useful to build trust and organic growth.

### Included Features
- Upload spectrum as CSV/TXT (auto-detect delimiter)
- Automatic peak detection with prominence filtering
- Manual peak addition/removal (click on spectrum)
- Gaussian, Lorentzian, and pseudo-Voigt profile fitting
- Multi-peak simultaneous Levenberg-Marquardt optimization
- Linear baseline correction
- Interactive residual plot
- Per-peak metrics: position, height, FWHM, area, shape factor
- R² and fit quality indicator
- Export: peak parameters CSV + fitted curve CSV + chart PNG/SVG
- Light/dark theme
- Print-friendly report

### Free Tier Limits
- Up to 5 peaks per spectrum
- Linear baseline only
- Single spectrum at a time
- No database matching
- Community support only

---

## 5. Premium Feature Roadmap

### Phase 1: Validation & Foundation (Months 1–3)
*Goal: Prove engine accuracy against reference data; fix scalability issues.*

| Feature | Effort | Description |
|---------|--------|-------------|
| NIST reference validation suite | M | Validate against NIST SRM 2241/2242 Raman standards |
| Synthetic benchmark suite | S | 50+ test spectra with known parameters, SNR levels |
| Optimizer robustness | M | Improve L-M convergence for >5 peaks (trust region, bounded params) |
| OriginPro comparison report | S | Publish accuracy comparison on 10 real-world spectra |
| Noise estimation improvements | S | Robust noise floor via MAD + iterative baseline clipping |

### Phase 2: Incremental Premium — $149–$249/yr (Months 4–8)
*Goal: Features that save time for regular users.*

| Feature | Effort | Price Tier | Description |
|---------|--------|-----------|-------------|
| Polynomial baseline (degree 2–8) | **M** | $149/yr | Auto-fit or manual baseline point selection |
| Shirley baseline | **M** | $149/yr | Essential for XPS — iterative Shirley algorithm |
| Asymmetric peak shapes | **M** | $149/yr | Exponentially modified Gaussian (EMG), split-Voigt |
| Custom peak model definitions | **M** | $249/yr | User-defined peak functions via formula editor |
| Unlimited peak count | **S** | $149/yr | Remove 5-peak cap, optimize for 20+ peaks |
| Fit constraints & bounds | **S** | $149/yr | Lock/bound parameters (e.g., fix peak position) |
| SVG/EPS export | **S** | $149/yr | Vector export for journal submission |
| Session save/load | **S** | $149/yr | Save full fit state as JSON, reload later |
| Keyboard shortcuts | **S** | $149/yr | Power-user workflow acceleration |

### Phase 3: Major Premium — $399–$599/yr (Months 9–18)
*Goal: Features that replace OriginPro/GRAMS for spectroscopy workflows.*

| Feature | Effort | Price Tier | Description |
|---------|--------|-----------|-------------|
| Batch processing | **L** | $399/yr | Upload folder of spectra, fit all with same model, export summary table |
| Spectral database matching | **XL** | $599/yr | Match peaks against RRUFF (Raman), NIST (IR), NIST XPS databases |
| 2D correlation spectroscopy | **XL** | $599/yr | Synchronous/asynchronous 2D correlation analysis |
| Tougaard baseline | **M** | $399/yr | Universal cross-section Tougaard for XPS |
| Peak fitting templates | **M** | $399/yr | Save/share fitting configurations for reproducibility |
| API access | **L** | $399/yr | REST API for integration with LIMS and lab automation |
| Multi-spectrum overlay | **L** | $399/yr | Compare spectra side-by-side with shared axes |
| Automated report generation | **M** | $399/yr | PDF report with fit parameters, residuals, methodology |
| Team workspaces | **L** | $599/yr | Shared projects with role-based access |

### Effort Key
| Size | Time | Description |
|------|------|-------------|
| **S** | 1–3 days | Single-function feature, well-defined scope |
| **M** | 1–2 weeks | Multi-component feature, needs validation |
| **L** | 3–6 weeks | Cross-cutting feature, engine + UI + tests |
| **XL** | 2–3 months | Major subsystem, external data integration |

---

## 6. Validation Requirements

### Synthetic Benchmarks (Engine Accuracy)
| Test | Criterion | Status |
|------|-----------|--------|
| Single Gaussian, known params | Position ±0.01, FWHM ±0.01, Area ±0.1% | ✅ Passing |
| Single Lorentzian, known params | Position ±0.01, FWHM ±0.01, Area ±0.1% | ✅ Passing |
| Single Voigt, known η | η ±0.02, other params ±0.01 | ✅ Passing |
| 3-peak overlap (50% FWHM separation) | All params ±1% | ✅ Passing |
| 5-peak complex spectrum | All params ±2% | ⚠️ Marginal |
| 10-peak dense spectrum | All params ±5% | ❌ Not yet |
| SNR = 100:1 | Params ±1% | ✅ Passing |
| SNR = 20:1 | Params ±5% | ⚠️ Marginal |
| SNR = 5:1 | Detect peaks, params ±15% | ❌ Not yet |

### NIST Reference Spectra
| Standard | Application | Status |
|----------|-------------|--------|
| SRM 2241 (Raman shift) | Validate wavenumber axis calibration | ❌ Planned |
| SRM 2242 (Raman intensity) | Validate relative intensity correction | ❌ Planned |
| NIST IR database spectra | Cross-validate peak positions on known compounds | ❌ Planned |
| NIST XPS database | Validate binding energy peak positions | ❌ Planned |

### Cross-Tool Comparison
| Reference Tool | Metric | Acceptance |
|---------------|--------|------------|
| OriginPro | Peak positions, FWHM, areas on 10 spectra | ±2% agreement |
| Fityk | Same spectra, same initial guesses | ±1% agreement |
| Published literature | Known Raman peak positions for Si, CaCO₃, polystyrene | ±1 cm⁻¹ |

---

## 7. Revenue Projections

### Assumptions
- Free tier grows to 5,000 MAU by month 12 (organic + SEO + academic citations)
- 3% conversion to $149/yr tier, 1% to $249/yr, 0.5% to $399/yr, 0.2% to $599/yr
- Churn: 20% annual for low tiers, 10% for high tiers
- Growth: 50% YoY user base growth years 2–3

### Year 1 (Months 7–12, post-Phase 2 launch)

| Tier | Price | Users | Annual Revenue |
|------|-------|-------|---------------|
| Free | $0 | 4,700 | $0 |
| Basic | $149/yr | 150 | $22,350 |
| Pro | $249/yr | 50 | $12,450 |
| **Total** | | **5,000** | **$34,800** |

### Year 2 (Full year, Phase 3 features available)

| Tier | Price | Users | Annual Revenue |
|------|-------|-------|---------------|
| Free | $0 | 6,800 | $0 |
| Basic | $149/yr | 225 | $33,525 |
| Pro | $249/yr | 100 | $24,900 |
| Lab | $399/yr | 38 | $15,162 |
| Enterprise | $599/yr | 15 | $8,985 |
| **Total** | | **7,500** | **$82,572** |

### Year 3 (Mature product, database matching live)

| Tier | Price | Users | Annual Revenue |
|------|-------|-------|---------------|
| Free | $0 | 9,500 | $0 |
| Basic | $149/yr | 340 | $50,660 |
| Pro | $249/yr | 170 | $42,330 |
| Lab | $399/yr | 85 | $33,915 |
| Enterprise | $599/yr | 40 | $23,960 |
| **Total** | | **11,250** | **$150,865** |

### Cost Structure
- Hosting: Vercel free/pro tier (~$0–$20/mo)
- Domain: ~$12/yr
- Analytics: Umami self-hosted ($0)
- Development: Solo developer (opportunity cost)
- Spectral databases: Public domain (RRUFF, NIST) — $0 licensing

---

## 8. Priority Ranking

Features ranked by (revenue impact × user demand) / effort:

| Rank | Feature | Effort | Revenue Impact | Rationale |
|------|---------|--------|---------------|-----------|
| 1 | Polynomial baseline | M | High | Table-stakes for most spectroscopy; unblocks 30% of users |
| 2 | Shirley baseline | M | High | XPS users cannot use tool without it; distinct market segment |
| 3 | Unlimited peak count | S | High | Removes biggest free-tier frustration; low effort |
| 4 | Fit constraints & bounds | S | Medium | Power users expect this; improves fit quality dramatically |
| 5 | Asymmetric peak shapes | M | Medium | EMG needed for chromatography crossover users |
| 6 | Batch processing | L | Very High | Killer feature for lab productivity; justifies $399/yr |
| 7 | Session save/load | S | Medium | Basic usability expectation; retention driver |
| 8 | Custom peak models | M | Medium | Differentiator vs Fityk; appeals to advanced researchers |
| 9 | Spectral database matching | XL | Very High | Unique value prop vs OriginPro; justifies $599/yr |
| 10 | Tougaard baseline | M | Medium | Completes XPS workflow alongside Shirley |
| 11 | Multi-spectrum overlay | L | Medium | Comparison workflow common in material science |
| 12 | 2D correlation spectroscopy | XL | High | Niche but high-value; almost no free alternatives exist |
| 13 | API access | L | Medium | Lab automation integration; enterprise feature |
| 14 | Team workspaces | L | Medium | Enterprise upsell; needs auth infrastructure |

### Recommended Execution Order
1. **Now:** Polynomial + Shirley baselines, unlimited peaks, constraints (Phase 2 launch)
2. **Next:** Asymmetric peaks, custom models, session save/load (Phase 2 expansion)
3. **Then:** Batch processing, database matching (Phase 3 — major revenue unlock)
4. **Later:** 2D correlation, API, team workspaces (Phase 3 expansion)
