
import { describe, expect, test } from 'vitest';

function getFinalScore(results: { mcq: number, fillups: number, video: number }): number {
  return results.mcq + results.fillups + results.video;
}

describe('Result Calculation', () => {
  test('total score is calculated', () => {
    const score = getFinalScore({ mcq: 3, fillups: 2, video: 5 });
    expect(score).toBe(10);
  });
});
