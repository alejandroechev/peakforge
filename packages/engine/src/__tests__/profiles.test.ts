import { describe, it, expect } from 'vitest';
import {
  gaussian, lorentzian, pseudoVoigt,
  gaussianArea, lorentzianArea, pseudoVoigtArea,
  evaluateProfile,
} from '../profiles';

describe('gaussian', () => {
  it('peak value equals H at x0', () => {
    expect(gaussian(50, 10, 50, 5)).toBeCloseTo(10, 10);
  });

  it('half-max at x0 ± FWHM/2', () => {
    const halfMax = gaussian(50 + 2.5, 10, 50, 5);
    expect(halfMax).toBeCloseTo(5, 5);
  });

  it('area matches analytical formula', () => {
    const H = 10, fwhm = 5;
    // Numerical integration
    const dx = 0.01;
    let numArea = 0;
    for (let x = -100; x <= 200; x += dx) {
      numArea += gaussian(x, H, 50, fwhm) * dx;
    }
    expect(numArea).toBeCloseTo(gaussianArea(H, fwhm), 1);
  });
});

describe('lorentzian', () => {
  it('peak value equals H at x0', () => {
    expect(lorentzian(50, 10, 50, 5)).toBeCloseTo(10, 10);
  });

  it('half-max at x0 ± FWHM/2', () => {
    const halfMax = lorentzian(52.5, 10, 50, 5);
    expect(halfMax).toBeCloseTo(5, 5);
  });

  it('area matches analytical formula', () => {
    const H = 10, fwhm = 5;
    const dx = 0.01;
    let numArea = 0;
    for (let x = -500; x <= 600; x += dx) {
      numArea += lorentzian(x, H, 50, fwhm) * dx;
    }
    expect(numArea).toBeCloseTo(lorentzianArea(H, fwhm), 0);
  });
});

describe('pseudoVoigt', () => {
  it('eta=0 gives pure Gaussian', () => {
    expect(pseudoVoigt(45, 10, 50, 5, 0)).toBeCloseTo(gaussian(45, 10, 50, 5), 10);
  });

  it('eta=1 gives pure Lorentzian', () => {
    expect(pseudoVoigt(45, 10, 50, 5, 1)).toBeCloseTo(lorentzian(45, 10, 50, 5), 10);
  });

  it('area interpolates between G and L areas', () => {
    const H = 10, fwhm = 5, eta = 0.3;
    const expected = eta * lorentzianArea(H, fwhm) + (1 - eta) * gaussianArea(H, fwhm);
    expect(pseudoVoigtArea(H, fwhm, eta)).toBeCloseTo(expected, 10);
  });
});

describe('evaluateProfile', () => {
  it('dispatches correctly', () => {
    expect(evaluateProfile(50, 10, 50, 5, 'gaussian')).toBeCloseTo(10);
    expect(evaluateProfile(50, 10, 50, 5, 'lorentzian')).toBeCloseTo(10);
    expect(evaluateProfile(50, 10, 50, 5, 'pseudoVoigt', 0.5)).toBeCloseTo(10);
  });
});
