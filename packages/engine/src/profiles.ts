const LN2 = Math.LN2;
const SQRT_PI_OVER_4LN2 = Math.sqrt(Math.PI / (4 * LN2));

export type ProfileType = 'gaussian' | 'lorentzian' | 'pseudoVoigt';

/** Gaussian peak: G(x) = H × exp(-4ln2 × ((x-x₀)/w)²) */
export function gaussian(x: number, H: number, x0: number, fwhm: number): number {
  const t = (x - x0) / fwhm;
  return H * Math.exp(-4 * LN2 * t * t);
}

/** Lorentzian peak: L(x) = H × w² / (4(x-x₀)² + w²) */
export function lorentzian(x: number, H: number, x0: number, fwhm: number): number {
  const dx = x - x0;
  return H * fwhm * fwhm / (4 * dx * dx + fwhm * fwhm);
}

/** Pseudo-Voigt: V(x) = η×L(x) + (1-η)×G(x) */
export function pseudoVoigt(
  x: number, H: number, x0: number, fwhm: number, eta: number,
): number {
  return eta * lorentzian(x, H, x0, fwhm) + (1 - eta) * gaussian(x, H, x0, fwhm);
}

/** Area under a Gaussian peak */
export function gaussianArea(H: number, fwhm: number): number {
  return H * fwhm * SQRT_PI_OVER_4LN2;
}

/** Area under a Lorentzian peak */
export function lorentzianArea(H: number, fwhm: number): number {
  return H * fwhm * Math.PI / 2;
}

/** Area under a pseudo-Voigt peak */
export function pseudoVoigtArea(H: number, fwhm: number, eta: number): number {
  return eta * lorentzianArea(H, fwhm) + (1 - eta) * gaussianArea(H, fwhm);
}

/** Evaluate a peak profile by type */
export function evaluateProfile(
  x: number, H: number, x0: number, fwhm: number,
  type: ProfileType, eta = 0.5,
): number {
  switch (type) {
    case 'gaussian': return gaussian(x, H, x0, fwhm);
    case 'lorentzian': return lorentzian(x, H, x0, fwhm);
    case 'pseudoVoigt': return pseudoVoigt(x, H, x0, fwhm, eta);
  }
}

/** Compute area for a given profile type */
export function profileArea(
  H: number, fwhm: number, type: ProfileType, eta = 0.5,
): number {
  switch (type) {
    case 'gaussian': return gaussianArea(H, fwhm);
    case 'lorentzian': return lorentzianArea(H, fwhm);
    case 'pseudoVoigt': return pseudoVoigtArea(H, fwhm, eta);
  }
}
