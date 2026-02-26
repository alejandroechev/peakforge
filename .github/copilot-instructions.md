---
applyTo: "**"
---
# PeakFit — Spectroscopy Peak Fitting

## Domain
- Peak deconvolution for Raman, FTIR, XPS, and other spectroscopy data
- Baseline correction (linear, polynomial)
- Peak detection via local maxima with prominence filtering
- Gaussian, Lorentzian, and pseudo-Voigt profile fitting
- Multi-peak simultaneous fitting via Levenberg-Marquardt optimization

## Key Equations
- Gaussian: `G = H × exp(-4ln2 × ((x-x₀)/w)²)`, Area = `H × w × √(π/(4ln2))`
- Lorentzian: `L = H × w² / (4(x-x₀)² + w²)`, Area = `H × w × π/2`
- Pseudo-Voigt: `V = η×L + (1-η)×G` where η ∈ [0,1]
- L-M update: `Δp = (JᵀJ + λI)⁻¹ Jᵀr`

## Validation Sources
- Synthetic spectra with known peak parameters (exact match)
- NIST Raman spectra with known peak positions
- OriginPro peak fitting output comparison



# Code Implementation Flow

<important>Mandatory Development Loop (non-negotiable)</important>

## Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

## Preparation & Definitions
- Use Typescript as default language, unless told otherwise
- Work using TDD with red/green flow ALWAYS
- If its a webapp: Add always Playwright E2E tests
- Separate domain logic from CLI/UI/WebAPI, unless told otherwise
- Every UI/WebAPI feature should have parity with a CLI way of testing that feature

## Validation
After completing any feature:
- Run all new unit tests, validate coverage is over 90%
- Use cli to test new feature
- If its a UI impacting feature: run all e2e tests
- If its a UI impacting feature: do a visual validation using Playwright MCP, take screenshots as you tests and review the screenshots to verify visually all e2e flows and the new feature. <important>If Playwright MCP is not available stop and let the user know</important>

If any of the validations step fail, fix the underlying issue.

## Finishing
- Update documentation for the project based on changes
- <important>Always commit after you finish your work with a message that explain both what is done, the context and a trail of the though process you made </important>


# Deployment

- git push master branch will trigger CI/CD in Github
- CI/CD in Github will run tests, if they pass it will be deployed to Vercel https://peakforge-chi.vercel.app/
- Umami analytics and Feedback form with Supabase database