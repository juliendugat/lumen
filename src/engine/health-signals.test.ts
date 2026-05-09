import { describe, expect, it } from 'vitest';
import { classifyVariation, pregnancyChance } from './health-signals';

describe('pregnancyChance', () => {
  const fertile = { start: '2026-05-23', end: '2026-05-31', peak: '2026-05-28' };

  it('high near peak', () => {
    expect(pregnancyChance('2026-05-28', fertile)).toBe('high');
    expect(pregnancyChance('2026-05-27', fertile)).toBe('high');
    expect(pregnancyChance('2026-05-29', fertile)).toBe('high');
  });
  it('moderate inside fertile window but away from peak', () => {
    expect(pregnancyChance('2026-05-23', fertile)).toBe('moderate');
    expect(pregnancyChance('2026-05-25', fertile)).toBe('moderate');
    expect(pregnancyChance('2026-05-31', fertile)).toBe('moderate');
  });
  it('low outside fertile window', () => {
    expect(pregnancyChance('2026-05-15', fertile)).toBe('low');
    expect(pregnancyChance('2026-06-05', fertile)).toBe('low');
  });
  it('unknown when no fertile window', () => {
    expect(pregnancyChance('2026-05-15', null)).toBe('unknown');
  });
});

describe('classifyVariation', () => {
  it('typical when fewer than 3 cycles', () => {
    expect(classifyVariation([28])).toBe('typical');
    expect(classifyVariation([28, 29])).toBe('typical');
  });
  it('stable when range < 5', () => {
    expect(classifyVariation([28, 28, 28, 30])).toBe('stable');
    expect(classifyVariation([26, 28, 30])).toBe('stable'); // range 4 → stable
  });
  it('typical for 5..8 day range', () => {
    expect(classifyVariation([26, 28, 30, 33])).toBe('typical');
  });
  it('atypical at ≥ 9 day range', () => {
    expect(classifyVariation([22, 28, 31])).toBe('atypical');
    expect(classifyVariation([21, 30, 35])).toBe('atypical');
  });
});
