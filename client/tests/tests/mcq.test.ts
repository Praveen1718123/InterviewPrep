
import { describe, expect, test } from 'vitest';

function checkAnswer(user: string, correct: string): boolean {
  return user.trim().toLowerCase() === correct.trim().toLowerCase();
}

describe('MCQ Tests', () => {
  test('correct answer is marked true', () => {
    expect(checkAnswer('B', 'b')).toBe(true);
  });

  test('incorrect answer is marked false', () => {
    expect(checkAnswer('C', 'b')).toBe(false);
  });
});
