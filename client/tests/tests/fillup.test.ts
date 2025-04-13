
import { describe, expect, test } from 'vitest';

function validateFillUp(userInput: string, answer: string): boolean {
  return userInput.trim().toLowerCase() === answer.trim().toLowerCase();
}

describe('Fill-Up Tests', () => {
  test('valid input', () => {
    expect(validateFillUp('TCP/IP', 'tcp/ip')).toBe(true);
  });

  test('blank input', () => {
    expect(validateFillUp('', 'TCP/IP')).toBe(false);
  });
});
