
import { describe, expect, test } from 'vitest';

describe('Admin Actions', () => {
  test('Admin adds valid question', () => {
    const question = {
      type: 'MCQ',
      question: 'What is a switch?',
      options: ['Device', 'Cable', 'IP'],
      answer: 'Device'
    };
    expect(question.options.includes(question.answer)).toBe(true);
  });
});
